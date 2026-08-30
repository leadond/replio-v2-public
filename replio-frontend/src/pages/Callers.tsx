/**
 * Callers Page - Full CRUD for contact management
 */

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Phone, Mail, History } from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'

interface Caller {
  id: string
  name: string
  phone_number: string
  email: string
  notes?: string
  company_id?: string
}

interface FormData {
  name: string
  phone_number: string
  email: string
  notes: string
}

const EMPTY_FORM: FormData = {
  name: '',
  phone_number: '',
  email: '',
  notes: '',
}

export default function Callers() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  // State for callers list
  const [callers, setCallers] = useState<Caller[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for form
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [selectedCaller, setSelectedCaller] = useState<Caller | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Fetch callers when companyId is available
  useEffect(() => {
    if (!companyId) return

    const fetchCallers = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.listCallers(companyId, searchTerm || undefined, 100, 0)
        setCallers(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load callers')
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchCallers, 300)
    return () => clearTimeout(debounce)
  }, [companyId, searchTerm])

  const handleAddCaller = async () => {
    if (!formData.name || !formData.phone_number || !formData.email) {
      setFormError('Please fill in all required fields')
      return
    }

    try {
      setFormLoading(true)
      setFormError(null)
      await apiClient.createCaller({
        company_id: companyId,
        name: formData.name,
        phone_number: formData.phone_number,
        email: formData.email,
        notes: formData.notes,
      })
      setFormData(EMPTY_FORM)
      setShowForm(false)
      // Refresh callers list
      const data = await apiClient.listCallers(companyId, searchTerm || undefined, 100, 0)
      setCallers(data || [])
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create caller')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateCaller = async () => {
    if (!editingId || !formData.name || !formData.phone_number || !formData.email) {
      setFormError('Please fill in all required fields')
      return
    }

    try {
      setFormLoading(true)
      setFormError(null)
      await apiClient.updateCaller(editingId, {
        name: formData.name,
        phone_number: formData.phone_number,
        email: formData.email,
        notes: formData.notes,
      })
      setFormData(EMPTY_FORM)
      setEditingId(null)
      setShowForm(false)
      // Refresh callers list
      const data = await apiClient.listCallers(companyId, searchTerm || undefined, 100, 0)
      setCallers(data || [])
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update caller')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteCaller = async (id: string) => {
    if (!confirm('Are you sure you want to delete this caller?')) return

    try {
      await apiClient.deleteCaller(id)
      // Refresh callers list
      const data = await apiClient.listCallers(companyId, searchTerm || undefined, 100, 0)
      setCallers(data || [])
      if (selectedCaller?.id === id) setSelectedCaller(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete caller')
    }
  }

  const handleEditCaller = (caller: Caller) => {
    setFormData({
      name: caller.name,
      phone_number: caller.phone_number,
      email: caller.email,
      notes: caller.notes || '',
    })
    setEditingId(caller.id)
    setShowForm(true)
    setSelectedCaller(caller)
  }

  const handleCancel = () => {
    setFormData(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setFormError(null)
  }

  // Filter callers
  const filteredCallers = callers.filter(caller => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      caller.name.toLowerCase().includes(term) ||
      caller.phone_number.includes(term) ||
      caller.email.toLowerCase().includes(term)
    )
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: 'calc(100vh - 100px)' }}>
      {/* Callers List */}
      <div style={{
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid rgba(45,212,191,0.15)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(45,212,191,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 0, marginBottom: 0 }}>Callers</h2>
            <button
              onClick={() => {
                setFormData(EMPTY_FORM)
                setEditingId(null)
                setShowForm(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'rgba(45,212,191,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: '#2dd4bf',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}>
              <Plus size={16} />
              Add
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
            }} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                background: 'rgba(45,212,191,0.05)',
                border: '1px solid rgba(45,212,191,0.2)',
                borderRadius: '6px',
                color: 'inherit',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div style={{ padding: '20px' }}>
            <Alert type="error" message={error} dismissible onClose={() => setError(null)} />
          </div>
        )}

        {/* Callers list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', color: '#9ca3af' }}>Loading callers...</div>
          ) : filteredCallers.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: '#9ca3af',
              textAlign: 'center',
              padding: '20px',
            }}>
              <div>
                <Phone size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No callers found</p>
              </div>
            </div>
          ) : (
            filteredCallers.map((caller) => (
              <div
                key={caller.id}
                onClick={() => setSelectedCaller(caller)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(45,212,191,0.1)',
                  cursor: 'pointer',
                  background: selectedCaller?.id === caller.id ? 'rgba(45,212,191,0.15)' : 'transparent',
                  transition: 'background 0.2s',
                }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{caller.name}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>
                  <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {caller.phone_number}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {caller.email}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details/Form Panel */}
      <div style={{
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid rgba(45,212,191,0.15)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
      }}>
        {showForm ? (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: '16px' }}>
              {editingId ? 'Edit Caller' : 'Add New Caller'}
            </h3>

            {formError && (
              <Alert type="error" message={formError} dismissible onClose={() => setFormError(null)} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '6px',
                    color: 'inherit',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '6px',
                    color: 'inherit',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '6px',
                    color: 'inherit',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '6px',
                    color: 'inherit',
                    fontSize: '14px',
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={editingId ? handleUpdateCaller : handleAddCaller}
                disabled={formLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(45,212,191,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#2dd4bf',
                  cursor: formLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: formLoading ? 0.5 : 1,
                }}>
                {formLoading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={handleCancel}
                disabled={formLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(139,92,246,0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#8b5cf6',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>
                Cancel
              </button>
            </div>
          </>
        ) : selectedCaller ? (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: '16px' }}>
              {selectedCaller.name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Phone</div>
                <div style={{ fontSize: '14px' }}>{selectedCaller.phone_number}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '14px' }}>{selectedCaller.email}</div>
              </div>
              {selectedCaller.notes && (
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '14px' }}>{selectedCaller.notes}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => handleEditCaller(selectedCaller)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(45,212,191,0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#2dd4bf',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}>
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={() => handleDeleteCaller(selectedCaller.id)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(244,63,94,0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#f43f5e',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}>
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: '#9ca3af',
            textAlign: 'center',
          }}>
            <div>
              <History size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Select a caller to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
