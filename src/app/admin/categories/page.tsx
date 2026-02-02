'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiPlus, FiEdit, FiTrash2, FiTag } from 'react-icons/fi'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  createdAt: string
  parentId: string | null
  parent: {
    id: string
    name: string
    slug: string
  } | null
  children: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    image: string | null
    _count: {
      products: number
    }
  }>
  _count: {
    products: number
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete category')
      }
      
      setCategories(categories.filter(c => c.id !== categoryId))
      setShowDeleteModal(false)
      setCategoryToDelete(null)
    } catch (err) {
      console.error('Error deleting category:', err)
      alert('Failed to delete category')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="mt-2 text-gray-600">Manage product categories</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <FiPlus className="h-4 w-4 mr-2" />
            Add Category
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="space-y-6">
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FiTag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new category.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/categories/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Add Category
              </Link>
            </div>
          </div>
        ) : (
          categories
            .filter(cat => !cat.parentId) // Only show main categories
            .map((category) => (
              <div key={category.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {category.image ? (
                        <img 
                          className="h-12 w-12 rounded-lg object-cover" 
                          src={category.image} 
                          alt={category.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <FiTag className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {category._count.products} products
                        {category.children.length > 0 && ` • ${category.children.length} subcategories`}
                      </p>
                    </div>
                  </div>
                  
                  {category.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  )}

                  {/* Subcategories */}
                  {category.children.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Subcategories</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.children.map((subcategory) => (
                          <div key={subcategory.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-gray-900">
                                  {subcategory.name}
                                </h5>
                                <p className="text-xs text-gray-500 mt-1">
                                  {subcategory._count.products} products
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 ml-2">
                                <Link
                                  href={`/admin/categories/${subcategory.slug}/edit`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit Subcategory"
                                >
                                  <FiEdit className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => {
                                    setCategoryToDelete(subcategory.id)
                                    setShowDeleteModal(true)
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Subcategory"
                                  disabled={subcategory._count.products > 0}
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Created {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/categories/${category.slug}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Category"
                      >
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setCategoryToDelete(category.id)
                          setShowDeleteModal(true)
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Category"
                        disabled={category._count.products > 0 || category.children.length > 0}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {(category._count.products > 0 || category.children.length > 0) && (
                    <div className="mt-2 text-xs text-yellow-600">
                      {category._count.products > 0 && 'Cannot delete category with products. '}
                      {category.children.length > 0 && 'Cannot delete category with subcategories.'}
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <FiTrash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Category</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this category? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDelete(categoryToDelete!)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setCategoryToDelete(null)
                  }}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
