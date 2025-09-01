export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/95" />

      {/* Animated Grid Pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.02]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent/2 rounded-full blur-2xl animate-pulse animation-delay-1000" />

      {/* Network Connection Lines */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.015]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="connectionGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Diagonal connecting lines suggesting data flow */}
        <path
          d="M0,100 Q200,200 400,300 T800,400"
          fill="none"
          stroke="url(#connectionGrad)"
          strokeWidth="2"
        />
        <path
          d="M800,100 Q600,200 400,300 T0,400"
          fill="none"
          stroke="url(#connectionGrad)"
          strokeWidth="2"
        />
        <path
          d="M200,0 Q400,100 600,200 T1000,300"
          fill="none"
          stroke="url(#connectionGrad)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
