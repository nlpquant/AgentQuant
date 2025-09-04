from logging import Logger
from time import time, sleep
from kubernetes import config, client
from mcp_server.config import settings as global_settings


def init_k8s_client(logger: Logger):
    try:
        config.load_kube_config(config_file=global_settings.k8s_config_file)
        logger.info("K8s config loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading K8s config: {e}")


def create_job(task_id: str, storage_key: str, code: str, logger: Logger):
    job_metadata = client.V1ObjectMeta(
        name=f"code-execution-{task_id}", namespace=global_settings.job_namespace
    )
    configMap = client.V1ConfigMap(metadata=job_metadata, data={"code": code})
    core_v1 = client.CoreV1Api()
    try:
        core_v1.create_namespaced_config_map(
            namespace=job_metadata.namespace, body=configMap
        )
    # catch already exist exception
    except client.ApiException as e:
        if e.status == 409:
            logger.warning(f"ConfigMap {job_metadata.name} already exists.")
        else:
            raise e

    pod_spec = client.V1PodSpec(
        init_containers=[
            client.V1Container(
                name="init-reader",
                image=global_settings.job_redis_image,
                image_pull_policy="IfNotPresent",
                command=[
                    "sh",
                    "-c",
                    "\n".join(
                        [
                            "set -e;",
                            "echo 'Fetching data from Redis...'",
                            f"redis-cli -h {global_settings.job_redis_host} -p {global_settings.job_redis_port} -n {global_settings.job_redis_db} get {storage_key} > /mnt/data/output.json;",
                            "echo 'Data fetched successfully.'"
                        ]
                    ),
                ],
                volume_mounts=[
                    client.V1VolumeMount(name="data-volume", mount_path="/mnt/data")
                ],
            )
        ],
        containers=[
            client.V1Container(
                name="code-execution",
                image=global_settings.job_runner_image,
                image_pull_policy="IfNotPresent",
                command=[
                    "python",
                    "-W",
                    "ignore::SyntaxWarning",
                    "/mnt/data/code/code.py",
                ],
                env=[
                    client.V1EnvVar(name="RAW_DATA_FILE", value="/mnt/data/output.json")
                ],
                volume_mounts=[
                    client.V1VolumeMount(name="data-volume", mount_path="/mnt/data"),
                    client.V1VolumeMount(
                        name="code-volume", mount_path="/mnt/data/code"
                    ),
                ],
            )
        ],
        volumes=[
            client.V1Volume(
                name="code-volume",
                config_map=client.V1ConfigMapVolumeSource(
                    name=job_metadata.name,
                    items=[client.V1KeyToPath(key="code", path="code.py")],
                ),
            ),
            client.V1Volume(
                name="data-volume",
                empty_dir=client.V1EmptyDirVolumeSource(),
            ),
        ],
        restart_policy="Never",
    )
    job_spec = client.V1JobSpec(
        template=client.V1PodTemplateSpec(spec=pod_spec),
        backoff_limit=0,
        completions=1,
        parallelism=1,
    )
    batch_v1 = client.BatchV1Api()
    job = client.V1Job(
        api_version="batch/v1", kind="Job", metadata=job_metadata, spec=job_spec
    )
    try:
        batch_v1.create_namespaced_job(namespace=job_metadata.namespace, body=job)
    except client.ApiException as e:
        if e.status == 409:
            logger.warning(f"Job {job_metadata.name} already exists.")
        else:
            raise e
    return job_metadata


def watch_job(job_metadata, timeout):
    batch_v1 = client.BatchV1Api()
    start_time = time()
    while True:
        job = batch_v1.read_namespaced_job(
            name=job_metadata.name, namespace=job_metadata.namespace
        )
        if job.status.succeeded:
            print(f"Job {job_metadata.name} completed successfully.")
            core_v1 = client.CoreV1Api()
            pod_list = core_v1.list_namespaced_pod(
                namespace=job_metadata.namespace,
                label_selector=f"job-name={job_metadata.name}",
            )
            if pod_list.items:
                pod = pod_list.items[0]
                logs = core_v1.read_namespaced_pod_log(
                    name=pod.metadata.name,
                    namespace=pod.metadata.namespace,
                    container="code-execution",
                )
                return {"success": True, "logs": logs}
            else:
                return {"success": False, "message": "No pods found"}
        elif job.status.failed:
            return {"success": False, "message": "Job failed"}
        if time() - start_time > timeout:
            return {"success": False, "message": "Job timed out"}
        sleep(1)
