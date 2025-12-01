import { useState, useCallback, useEffect } from 'react'
import { contactMessageQueries } from '../lib/queries'
import type {
  ContactMessage,
  CreateContactMessageInput,
  ContactMessageStatus
} from '../types/database'

// Hook for creating a contact message
export const useCreateContactMessage = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createContactMessage = useCallback(async (input: CreateContactMessageInput) => {
    setLoading(true)
    setError(null)

    try {
      const message = await contactMessageQueries.create(input)
      return message
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit contact message'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { createContactMessage, loading, error }
}

// Hook for fetching a single contact message
export const useContactMessage = (id: string) => {
  const [message, setMessage] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessage = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setMessage(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await contactMessageQueries.getById(id)
      setMessage(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contact message')
    } finally {
      setLoading(false)
    }
  }, [id])

  return { message, loading, error, refetch: fetchMessage }
}

// Hook for fetching all contact messages (admin use)
export const useAllContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await contactMessageQueries.getAll()
      setMessages(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contact messages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return { messages, loading, error, refetch: fetchMessages }
}

// Hook for updating contact message status (admin use)
export const useUpdateContactMessageStatus = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStatus = useCallback(async (id: string, status: ContactMessageStatus): Promise<ContactMessage | null> => {
    setLoading(true)
    setError(null)

    try {
      const data = await contactMessageQueries.updateStatus(id, status)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact message status'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateStatus, loading, error }
}

