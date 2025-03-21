interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  color?: "primary" | "white" | "gray"
}

export default function LoadingSpinner({ size = "medium", color = "primary" }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-2",
    large: "h-12 w-12 border-3",
  }

  const colorClasses = {
    primary: "border-orange-500",
    white: "border-white",
    gray: "border-gray-500",
  }

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} border-t-transparent ${colorClasses[color]}`}
      aria-label="Loading"
    />
  )
}

