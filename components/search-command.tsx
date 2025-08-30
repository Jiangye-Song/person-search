'use client'

import * as React from "react"
import { useCallback, useState, useRef, useEffect } from "react"
import { Check, Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * Props for the SearchCommand component
 * @template T - The type of data being searched
 */
export interface SearchCommandProps<T> {
  /** Async function that performs the search and returns an array of results */
  onSearch: (value: string) => Promise<T[]>
  /** Callback function called when an item is selected */
  onItemSelect: (item: T) => void
  /** Function to get a unique identifier from an item */
  getItemId: (item: T) => string
  /** Function to get the display label from an item */
  getItemLabel: (item: T) => string
  /** Placeholder text for the search input */
  placeholder?: string
  /** Text to display when no results are found */
  noResultsText?: string
}

/**
 * A reusable search command component that provides a simple, focus-friendly search interface
 * with async search capabilities and no focus stealing.
 * 
 * @template T - The type of data being searched
 * 
 * @example
 * // Basic usage with a User type
 * interface User {
 *   id: string;
 *   name: string;
 * }
 * 
 * function UserSearch() {
 *   return (
 *     <SearchCommand<User>
 *       onSearch={async (query) => {
 *         const users = await fetchUsers(query);
 *         return users;
 *       }}
 *       onItemSelect={(user) => console.log('Selected:', user)}
 *       getItemId={(user) => user.id}
 *       getItemLabel={(user) => user.name}
 *       placeholder="Search users..."
 *     />
 *   );
 * }
 * 
 * @features
 * - 🎨 Theme aware (works with light/dark mode)
 * - 🔍 Async search with loading states
 * - 📱 Responsive design
 * - 🎯 Focus-friendly (no focus stealing)
 * - �️ Click and keyboard friendly
 * 
 * @accessibility
 * - Maintains input focus at all times
 * - Proper ARIA labels and roles
 * - Screen reader friendly
 */
export const SearchCommand = <T,>({
  onSearch,
  onItemSelect,
  getItemId,
  getItemLabel,
  placeholder = "Search...",
  noResultsText = "No results found.",
}: SearchCommandProps<T>) => {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback(async (value: string) => {
    setSearchQuery(value)

    if (!value.trim()) {
      setItems([])
      setShowResults(false)
      return
    }

    setLoading(true)
    setShowResults(true)

    try {
      const results = await onSearch(value)
      setItems(results)
    } catch (error) {
      console.error('Error searching:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [onSearch])

  const handleSelect = useCallback((item: T) => {
    setSelectedItem(item)
    setShowResults(false)
    setSearchQuery(getItemLabel(item))
    onItemSelect(item)

    // Keep focus on input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }, [getItemLabel, onItemSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false)
    }
  }, [])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        inputRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const shouldShowResults = showResults && (items.length > 0 || loading) && searchQuery.trim()

  return (
    <div className="w-full relative">
      {/* Search Input */}
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          // Re-show results if we have them and a query
          if (items.length > 0 && searchQuery.trim()) {
            setShowResults(true)
          }
        }}
        className="rounded-lg border shadow-md"
        autoComplete="off"
      />

      {/* Results Dropdown */}
      {shouldShowResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-lg shadow-lg max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Search results"
        >
          {loading ? (
            <div className="flex items-center gap-2 py-6 px-4 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : items.length === 0 ? (
            <div className="py-6 px-4 text-center text-muted-foreground">
              {noResultsText}
            </div>
          ) : (
            items.map((item) => (
              <div
                key={getItemId(item)}
                className="flex items-center px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => handleSelect(item)}
                onMouseDown={(e) => {
                  // Prevent default to avoid input losing focus
                  e.preventDefault()
                }}
                role="option"
                aria-selected={selectedItem && getItemId(selectedItem) === getItemId(item) ? true : false}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedItem && getItemId(selectedItem) === getItemId(item) ? "opacity-100" : "opacity-0"
                  )}
                />
                {getItemLabel(item)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

