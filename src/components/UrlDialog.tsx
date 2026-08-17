import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useMutation } from "convex/react"
import { ConvexError } from "convex/values"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"


interface UrlDialogProps {
  ref: React.RefObject<HTMLDialogElement | null>
  /** the entry to edit; when absent, the dialog creates a new entry */
  editedUrlDoc?: Doc<"urls">
  /** called with the id of a freshly created entry */
  onCreated?: (urlId: Id<"urls">) => void
  onClose: () => void
}

type FormData = {
  description?: string
  url?: string
  error?: string
}

function UrlDialog({ ref: dialogRef, editedUrlDoc, onCreated, onClose }: UrlDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<FormData | undefined>(undefined)
  const setError = (e: string | undefined) => setFormData(data => ({ ...data, error: e }))
  const setDescription = (d: string | undefined) => setFormData(data => ({ ...data, description: d }))
  const setUrl = (u: string | undefined) => setFormData(data => ({ ...data, url: u }))

  const addUrl = useMutation(api.urls.add)
  const updateUrl = useMutation(api.urls.update)

  useEffect(() => {
    // set fields from editedUrlDoc or set to empty values (for new entries)
      setFormData({
        description: editedUrlDoc?.description ?? "",
        url: editedUrlDoc?.url ?? "",
        error: undefined,
      })
  }, [editedUrlDoc])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmedUrl = formData?.url?.trim()
    if (!trimmedUrl) {
      setError("A URL is required")
      return
    }
    const trimmedDescription = formData?.description?.trim()

    setIsSaving(true)
    setError(undefined)
    try {
      if (editedUrlDoc) {
        await updateUrl({
          urlId: editedUrlDoc._id,
          url: trimmedUrl,
          description: trimmedDescription,
        })
      } else {
        const urlId = await addUrl({ url: trimmedUrl, description: trimmedDescription })
        onCreated?.(urlId)
      }
      dialogRef.current?.close()
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Could not save the URL")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    dialogRef.current?.close()
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">
          {editedUrlDoc ? "Edit URL" : "Add a URL"}
        </h3>
        <form onSubmit={handleSubmit}>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Title</legend>
            <input
              autoFocus
              className="input w-full"
              value={formData?.description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How to call this URL"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">URL</legend>
            <input
              className="input w-full"
              value={formData?.url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </fieldset>
          {formData?.error && <p className="text-error mt-2 text-sm">{formData?.error}</p>}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {editedUrlDoc ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}

export default UrlDialog
