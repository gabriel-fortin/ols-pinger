import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"

function AddUrlForm() {
  const [url, setUrl] = useState("")
  const addUrl = useMutation(api.urls.add)

  const handleAddUrl = () => {
    if (!url.trim()) return
    addUrl({ url })
  }

  return (
    <div className="flex gap-2">
      <input
        className="input input-bordered"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter a URL"
      />
      <button type="button" className="btn btn-primary" onClick={handleAddUrl}>
        Add URL
      </button>
    </div>
  )
}

export default AddUrlForm
