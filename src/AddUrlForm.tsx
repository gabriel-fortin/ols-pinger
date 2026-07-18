import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../convex/_generated/api"

function AddUrlForm() {
  const [url, setUrl] = useState("")
  const addUrl = useMutation(api.urls.add)

  const handleAddUrl = () => {
    if (!url.trim()) return
    addUrl({ url })
  }

  return (
    <>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter a URL"
      />
      <button type="button" onClick={handleAddUrl}>
        Add URL
      </button>
    </>
  )
}

export default AddUrlForm
