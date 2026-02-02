'use client'

import { useState, useEffect } from 'react'
import { FiImage, FiX, FiCheck, FiFolder } from 'react-icons/fi'

// Only show images from this folder (under /public). Subfolders become tabs automatically.
const ROOT_FOLDER = '/products'

// Fallback when API fails or returns empty (only paths under ROOT_FOLDER)
const FALLBACK_IMAGES = [
  '/products/pic1.png', '/products/pic2.png', '/products/clothing/dress-style-1.png', '/products/towels/pic4.png',
]

/** Ensure path uses forward slashes and has leading / for correct src and folder matching */
function normalizePath(p: string): string {
  if (!p || typeof p !== 'string') return ''
  // Strip full URL to pathname (e.g. http://localhost:3000/images/pic1.png -> /images/pic1.png)
  try {
    if (p.startsWith('http://') || p.startsWith('https://')) {
      p = new URL(p).pathname
    }
  } catch {
    // ignore
  }
  const forward = p.replace(/\\/g, '/').trim()
  return forward.startsWith('/') ? forward : '/' + forward
}

/** Get all unique folder paths from image paths (e.g. /images, /images/clothing) */
function getAllFolders(images: string[]): string[] {
  const set = new Set<string>()
  images.forEach(imgPath => {
    const parts = imgPath.split('/').filter(Boolean)
    // Build all folder levels: /images, /images/clothing, etc.
    let current = ''
    for (let i = 0; i < parts.length - 1; i++) { // -1 to exclude filename
      current += '/' + parts[i]
      set.add(current)
    }
  })
  return Array.from(set).sort()
}

interface ImagePickerProps {
  value: string
  onChange: (value: string) => void
  label: string
  multiple?: boolean
  /** Optional: pre-loaded list from server; if not provided, fetched from /api/admin/images when picker opens */
  availableImages?: string[]
}

export default function ImagePicker({ value, onChange, label, multiple = false, availableImages: availableImagesProp }: ImagePickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('') // '' = All
  const [fetchedImages, setFetchedImages] = useState<string[]>([])
  const [loadingImages, setLoadingImages] = useState(false)

  // Use prop if provided, else API result, else fallback; normalize so all paths start with /
  const rawImages =
    availableImagesProp?.length ? availableImagesProp
    : fetchedImages.length ? fetchedImages
    : FALLBACK_IMAGES
  
  console.log('ImagePicker: availableImagesProp:', availableImagesProp?.length || 0, 'fetchedImages:', fetchedImages.length, 'using:', rawImages.length, 'images')
  
  const availableImages = rawImages
    .map(normalizePath)
    .filter(p => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(p))
    .filter(p => p.startsWith(ROOT_FOLDER + '/') || p === ROOT_FOLDER) // Only /public/products and its subfolders
  
  const allFolders = getAllFolders(availableImages) // Tabs: /products, /products/clothing, /products/towels, etc.
  
  console.log('ImagePicker: After normalization and filtering:', availableImages.length, 'images under', ROOT_FOLDER)
  console.log('ImagePicker: Folders:', allFolders)

  // When picker opens, fetch images from public folder if not provided
  useEffect(() => {
    if (!showPicker || availableImagesProp?.length) return
    let cancelled = false
    setLoadingImages(true)
    setSelectedFolder('') // Reset to "All" when opening
    fetch('/api/admin/images')
      .then((res) => res.ok ? res.json() : { images: [] })
      .then((data: { images?: string[] }) => {
        if (!cancelled && Array.isArray(data.images) && data.images.length) {
          setFetchedImages(data.images)
        }
      })
      .catch(() => { /* use fallback */ })
      .finally(() => { if (!cancelled) setLoadingImages(false) })
    return () => { cancelled = true }
  }, [showPicker, availableImagesProp?.length])

  // Filter by selected folder and search term
  const filteredImages = availableImages.filter(imgPath => {
    // Folder filter: if folder selected, only show images in that folder
    const inFolder = !selectedFolder || imgPath.startsWith(selectedFolder + '/')
    // Search filter: if search term entered, path must contain it
    const matchesSearch = !searchTerm.trim() || imgPath.toLowerCase().includes(searchTerm.toLowerCase())
    return inFolder && matchesSearch
  })
  
  console.log('ImagePicker: Filtered images:', filteredImages.length, 'of', availableImages.length, 'in folder:', selectedFolder || 'All')

  const handleImageSelect = (imagePath: string) => {
    if (multiple) {
      const currentImages = value ? value.split(', ') : []
      if (!currentImages.includes(imagePath)) {
        onChange([...currentImages, imagePath].join(', '))
      }
    } else {
      onChange(imagePath)
      setShowPicker(false)
    }
  }

  const handleRemoveImage = (imagePath: string) => {
    if (multiple) {
      const currentImages = value ? value.split(', ') : []
      onChange(currentImages.filter(img => img !== imagePath).join(', '))
    } else {
      onChange('')
    }
  }

  const currentImages = multiple && value ? value.split(', ').filter(img => img) : (value ? [value] : [])

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Current Images Display */}
      {currentImages.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {currentImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Selected ${index + 1}`}
                  className="h-16 w-16 object-cover rounded border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    // Only fallback once to prevent loop
                    const currentSrc = new URL(target.src, window.location.origin).pathname
                    if (currentSrc !== '/images/pic1.png' && currentSrc !== '/images/placeholder.png') {
                      target.src = '/images/pic1.png'
                    } else {
                      // If fallback also fails, hide it
                      target.style.display = 'none'
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Picker Button */}
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <FiImage className="h-4 w-4 mr-2" />
        {multiple ? 'Add Images' : 'Select Image'}
      </button>

      {/* Image Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {multiple ? 'Select Images' : 'Select Image'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {loadingImages ? 'Loading...' : `${availableImages.length} images from ${ROOT_FOLDER} and subfolders`}
                  </p>
                </div>
                <button
                  onClick={() => setShowPicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              {/* Folder browser - click to navigate */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Browse folders:
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setSelectedFolder('')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedFolder === '' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FiFolder className="h-4 w-4" />
                    All ({availableImages.length})
                  </button>
                  {allFolders.map((folder) => {
                    const count = availableImages.filter(p => p.startsWith(folder + '/')).length
                    return (
                      <button
                        key={folder}
                        type="button"
                        onClick={() => setSelectedFolder(folder)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          selectedFolder === folder
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <FiFolder className="h-4 w-4" />
                        {folder} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by path or filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Image Grid — always use leading slash so images load from site root */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto border-2 border-dashed border-gray-300 p-4 min-h-[200px]">
                {filteredImages.length > 0 ? (
                  filteredImages.map((imagePath, index) => {
                    const src = normalizePath(imagePath)
                    console.log(`Rendering image ${index}:`, src)
                    return (
                      <div
                        key={`${src}-${index}`}
                        role="button"
                        tabIndex={0}
                        className="relative group cursor-pointer rounded border-2 border-gray-300 hover:border-blue-500 hover:ring-2 hover:ring-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        onClick={() => {
                          console.log('Image clicked:', imagePath)
                          handleImageSelect(imagePath)
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleImageSelect(imagePath) } }}
                      >
                        <img
                          src={src}
                          alt={src}
                          className="w-full h-20 object-cover rounded-t border-0"
                          onLoad={() => console.log('Image loaded:', src)}
                          onError={(e) => {
                            console.error('Image failed to load:', src)
                            const target = e.target as HTMLImageElement
                            // Show broken image instead of hiding
                            target.alt = `❌ ${src}`
                            target.style.opacity = '0.3'
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center pointer-events-none">
                          <FiCheck className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-gray-600 mt-1 truncate px-1 pb-1 bg-white" title={src}>
                          {src}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full text-center text-gray-500">
                    No images to display
                  </div>
                )}
              </div>

              {(loadingImages || filteredImages.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  {loadingImages ? 'Loading…' : `No images found. Add images to /public${ROOT_FOLDER} or try a different search.`}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

