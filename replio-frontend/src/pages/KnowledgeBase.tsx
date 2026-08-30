/**
 * Knowledge Base Page - Document management and AI training data
 * Designed with crypto trading dashboard aesthetic
 */

import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit2, Clock, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'
import { LoadingSpinner } from '../components/LoadingSpinner'

interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  version: number
  views: number
  usage_in_ai: number
  status: 'draft' | 'published' | 'archived'
}

interface FormData {
  title: string
  content: string
  category: string
  tags: string
}

const EMPTY_FORM: FormData = {
  title: '',
  content: '',
  category: '',
  tags: '',
}

const CATEGORIES = ['Product Info', 'FAQ', 'Policies', 'Troubleshooting', 'How-To', 'Best Practices', 'Legal', 'Other']

// Mock data generator for demo
const generateMockArticles = (count: number = 8): KnowledgeArticle[] => {
  const titles = [
    'Product Overview and Features',
    'Pricing and Billing FAQ',
    'Data Security and Privacy',
    'Account Setup Guide',
    'API Integration Guide',
    'Troubleshooting Common Issues',
    'Best Practices for Implementation',
    'Compliance and Certifications',
  ]

  const categories = ['Product Info', 'FAQ', 'Policies', 'Troubleshooting', 'How-To', 'Best Practices', 'Legal']
  const tagSets = [
    ['documentation', 'onboarding'],
    ['billing', 'payments', 'pricing'],
    ['security', 'compliance', 'privacy'],
    ['setup', 'configuration', 'guide'],
    ['api', 'integration', 'developer'],
    ['troubleshooting', 'support'],
    ['best-practices', 'optimization'],
    ['legal', 'terms', 'compliance'],
  ]

  return Array.from({ length: count }).map((_, idx) => ({
    id: `kb-${idx + 1}`,
    title: titles[idx] || `Knowledge Base Article ${idx + 1}`,
    content: `This is the content for the "${titles[idx] || 'Article'}" article. It contains important information about the product and should be regularly updated.`,
    category: categories[idx % categories.length],
    tags: tagSets[idx] || ['documentation'],
    created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    version: Math.floor(Math.random() * 5) + 1,
    views: Math.floor(Math.random() * 5000) + 100,
    usage_in_ai: Math.floor(Math.random() * 2000) + 50,
    status: Math.random() > 0.2 ? 'published' : 'draft',
  }))
}

export default function KnowledgeBase() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  // State for articles
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // State for form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // State for selected article
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)

  // Initialize with mock data
  useEffect(() => {
    const initializeArticles = () => {
      try {
        setLoading(true)
        // In production, this would call: await apiClient.listKnowledgeArticles(companyId)
        const mockArticles = generateMockArticles(8)
        setArticles(mockArticles)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load articles')
      } finally {
        setLoading(false)
      }
    }

    initializeArticles()
  }, [companyId])

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = filterCategory === 'all' || article.category === filterCategory
    const matchesStatus = filterStatus === 'all' || article.status === filterStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Handle create/update article
  const handleSaveArticle = async () => {
    if (!formData.title || !formData.content || !formData.category) {
      setFormError('Please fill in all required fields')
      return
    }

    try {
      setFormLoading(true)
      setFormError(null)

      const articleData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        status: 'published' as const,
      }

      if (editingId) {
        // Update existing
        const updatedArticle: KnowledgeArticle = articles.find(a => a.id === editingId)!
        const updated = {
          ...updatedArticle,
          ...articleData,
          updated_at: new Date().toISOString(),
          version: updatedArticle.version + 1,
        }
        setArticles(articles.map(a => a.id === editingId ? updated : a))
      } else {
        // Create new
        const newArticle: KnowledgeArticle = {
          id: `kb-${Date.now()}`,
          ...articleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
          views: 0,
          usage_in_ai: 0,
          tags: articleData.tags,
        }
        setArticles([newArticle, ...articles])
      }

      setFormData(EMPTY_FORM)
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save article')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete article
  const handleDeleteArticle = (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      setArticles(articles.filter(a => a.id !== id))
      if (selectedArticle?.id === id) setSelectedArticle(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article')
    }
  }

  // Handle edit article
  const handleEditArticle = (article: KnowledgeArticle) => {
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags.join(', '),
    })
    setEditingId(article.id)
    setShowForm(true)
  }

  // Calculate statistics
  const totalArticles = articles.length
  const publishedCount = articles.filter(a => a.status === 'published').length
  const totalViews = articles.reduce((sum, a) => sum + a.views, 0)
  const totalAIUsage = articles.reduce((sum, a) => sum + a.usage_in_ai, 0)

  if (loading) {
    return <LoadingSpinner message="Loading knowledge base..." />
  }

  return (
    <div style={{ background: '#0f1728', minHeight: '100vh', padding: '20px' }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: 0, marginBottom: '4px' }}>
            Knowledge Base
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Manage articles and AI training data
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setFormData(EMPTY_FORM)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,255,170,0.1) 100%)',
            color: '#00d4ff',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(0,255,170,0.15) 100%)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,255,170,0.1) 100%)'
          }}
        >
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Statistics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase' }}>
            Total Articles
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00d4ff' }}>
            {totalArticles}
          </div>
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(0,255,170,0.2)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase' }}>
            Published
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ffaa' }}>
            {publishedCount}
          </div>
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,107,107,0.2)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase' }}>
            Total Views
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>
            {totalViews.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,165,0,0.2)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase' }}>
            AI Usage
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffa500' }}>
            {totalAIUsage.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', marginBottom: '32px' }}>
        {/* Articles List */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(45,212,191,0.15)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(45,212,191,0.15)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginTop: 0, marginBottom: '16px', color: '#00d4ff', textTransform: 'uppercase' }}>
              Articles
            </h2>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }} />
              <input
                type="text"
                placeholder="Search articles, tags..."
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

            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(45,212,191,0.05)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '6px',
                  color: 'inherit',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(45,212,191,0.05)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '6px',
                  color: 'inherit',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Articles List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '600px',
          }}>
            {filteredArticles.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#9ca3af',
              }}>
                <p>No articles found</p>
              </div>
            ) : (
              filteredArticles.map(article => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(45,212,191,0.1)',
                    cursor: 'pointer',
                    background: selectedArticle?.id === article.id
                      ? 'rgba(0,212,255,0.1)'
                      : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedArticle?.id !== article.id) {
                      e.currentTarget.style.background = 'rgba(45,212,191,0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedArticle?.id !== article.id) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        {article.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: 'rgba(0,212,255,0.15)',
                          color: '#00d4ff',
                          borderRadius: '4px',
                          fontSize: '10px',
                        }}>
                          {article.category}
                        </span>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: article.status === 'published'
                            ? 'rgba(0,255,170,0.15)'
                            : 'rgba(255,165,0,0.15)',
                          color: article.status === 'published' ? '#00ffaa' : '#ffa500',
                          borderRadius: '4px',
                          fontSize: '10px',
                          textTransform: 'capitalize',
                        }}>
                          {article.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    fontSize: '11px',
                    color: '#8899aa',
                  }}>
                    <span>v{article.version}</span>
                    <span>{article.views} views</span>
                    <span>{article.usage_in_ai} AI uses</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Article Details Sidebar */}
        <div>
          {selectedArticle ? (
            <div style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '12px',
              padding: '20px',
              backdropFilter: 'blur(10px)',
              maxHeight: '700px',
              overflow: 'auto',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#00d4ff', marginTop: 0, marginBottom: '16px' }}>
                Details
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Title
                </div>
                <div style={{ fontSize: '12px', color: '#fff' }}>
                  {selectedArticle.title}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Category
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: 'rgba(0,212,255,0.15)',
                  color: '#00d4ff',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}>
                  {selectedArticle.category}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Tags
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedArticle.tags.map(tag => (
                    <span key={tag} style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      background: 'rgba(0,255,170,0.15)',
                      color: '#00ffaa',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: 'rgba(0,212,255,0.05)',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#9ca3af' }}>Views</span>
                  <span style={{ color: '#00d4ff', fontWeight: '600' }}>
                    {selectedArticle.views.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#9ca3af' }}>AI Usage</span>
                  <span style={{ color: '#00ffaa', fontWeight: '600' }}>
                    {selectedArticle.usage_in_ai.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#9ca3af' }}>Version</span>
                  <span style={{ color: '#ffa500', fontWeight: '600' }}>
                    v{selectedArticle.version}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                fontSize: '11px',
                color: '#8899aa',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  Created: {new Date(selectedArticle.created_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  Updated: {new Date(selectedArticle.updated_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}>
                <button
                  onClick={() => handleEditArticle(selectedArticle)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: 'rgba(0,212,255,0.15)',
                    color: '#00d4ff',
                    border: '1px solid rgba(0,212,255,0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,212,255,0.25)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,212,255,0.15)'
                  }}
                >
                  <Edit2 size={12} />
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteArticle(selectedArticle.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: 'rgba(255,107,107,0.15)',
                    color: '#ff6b6b',
                    border: '1px solid rgba(255,107,107,0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,107,107,0.25)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,107,107,0.15)'
                  }}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(45,212,191,0.15)',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              color: '#9ca3af',
            }}>
              <p>Select an article to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: '#0f1728',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#00d4ff',
                margin: 0,
                textTransform: 'uppercase',
              }}>
                {editingId ? 'Edit Article' : 'Create Article'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData(EMPTY_FORM)
                  setFormError(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                padding: '12px',
                background: 'rgba(255,107,107,0.15)',
                border: '1px solid rgba(255,107,107,0.3)',
                borderRadius: '6px',
                color: '#ff6b6b',
                fontSize: '12px',
                marginBottom: '16px',
              }}>
                {formError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}>
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Article title..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}>
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Article content..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(45,212,191,0.05)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '6px',
                  color: 'inherit',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  minHeight: '120px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(45,212,191,0.05)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '6px',
                  color: 'inherit',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., documentation, onboarding..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData(EMPTY_FORM)
                  setFormError(null)
                }}
                style={{
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: 'rgba(45,212,191,0.05)',
                  color: '#9ca3af',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(45,212,191,0.1)'
                  e.currentTarget.style.color = '#00d4ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(45,212,191,0.05)'
                  e.currentTarget.style.color = '#9ca3af'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveArticle}
                disabled={formLoading}
                style={{
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,255,170,0.1) 100%)',
                  color: formLoading ? '#6b7280' : '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.3)',
                  borderRadius: '6px',
                  cursor: formLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: formLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!formLoading) {
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(0,255,170,0.15) 100%)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!formLoading) {
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,255,170,0.1) 100%)'
                  }
                }}
              >
                {formLoading ? 'Saving...' : 'Save Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{ marginTop: '20px' }}>
          <Alert type="error" title="Error" message={error} dismissible />
        </div>
      )}
    </div>
  )
}
