'use client'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { startsWith } from 'lodash-es'
import { useState } from 'react'
import { Markdown } from '../components/base/markdown'
import { API_KEY } from '@/config'

class FatalError extends Error { }

const EventStreamContentType = 'text/event-stream'

const Index = () => {
  const [str, setStr] = useState('')
  const onClick = async () => {
    try {
      await fetchEventSource('https://api.dify.ai/v1/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        openWhenHidden: true,
        body: JSON.stringify({
          inputs: {},
          query: '',
          response_mode: 'streaming',
          conversation_id: '',
          user: '',
        }),
        async onopen(response) {
          console.log('🚀 ~ :27 ~ onopen ~ response:', response)
          if (response.ok && startsWith(response.headers.get('content-type') as string, EventStreamContentType))
            return
          if (response.status >= 400 && response.status < 500 && response.status !== 429)
            throw new FatalError()
          //   throw new RetriableError()
        },
        onmessage(msg) {
          console.log('🚀 ~ :35 ~ onmessage ~ msg:', msg)
          if (msg.event === 'FatalError')
            throw new FatalError(msg.data)
          // Log the streaming message
          console.log('stream message:', msg)
          const jsonData = JSON.parse(msg.data)

          if (jsonData.event === 'message')
            setStr(prev => `${prev}${jsonData.answer}`)
        },
        onclose() {
          console.log('Stream closed')
          //   throw new RetriableError()
        },
        onerror(err) {
          console.log('Error occurred:', err)
          if (err instanceof FatalError)
            throw err
          // do nothing to automatically retry
        },
      })
    }
    catch (err) {
      // Optionally handle errors here
      // e.g. setStr('Error: ' + err.message)
    }
  }
  return <div>
    <Markdown content={str} />
    <div onClick={onClick}>
      开始流式输出
    </div>
  </div>
}

export default Index
