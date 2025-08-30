'use client'

import * as React from "react"
import { SearchCommand } from "@/components/search-command"
import { searchUsers } from '@/app/actions/actions'
import { User } from "../actions/schemas"



export default function SearchInput() {
  const handleSearch = React.useCallback(async (value: string) => {
    return searchUsers(value)
  }, [])

  const handleSelect = React.useCallback((user: User) => {
    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set('userId', user.id)
    window.history.pushState({}, '', url.toString())
    window.location.reload()
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      <SearchCommand<User>
        onSearch={handleSearch}
        onItemSelect={handleSelect}
        getItemId={(user) => user.id}
        getItemLabel={(user) => user.name || user.email}
        placeholder="Search users..."
        noResultsText="No users found."
      />
    </div>
  )
}

