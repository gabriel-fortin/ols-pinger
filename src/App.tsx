import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'

function App() {
  const tasks = useQuery(api.tasks.list)
  const addTask = useMutation(api.tasks.add)
  const [text, setText] = useState('')

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          addTask({ text })
          setText('')
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New task"
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {tasks?.map((task) => <li key={task._id}>{task.text}</li>)}
      </ul>
    </div>
  )
}

export default App
