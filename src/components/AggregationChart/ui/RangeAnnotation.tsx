interface RangeAnnotationProps {
  range: { from: number; to: number } | undefined
}

function RangeAnnotation({ range }: RangeAnnotationProps) {
  if (!range) return null

  return (
    <div className="text-xs text-base-content/60">
      <span>Displayed range: &nbsp;</span>
      {new Date(range.from).toLocaleString("en-GB")}
      {" → "}
      {new Date(range.to).toLocaleString("en-GB")}
    </div>
  )
}

export default RangeAnnotation
