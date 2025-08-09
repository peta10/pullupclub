export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9b9b6f] mx-auto"></div>
        <p className="text-[#9b9b6f] font-medium">Loading Pull-Up Club...</p>
      </div>
    </div>
  )
}