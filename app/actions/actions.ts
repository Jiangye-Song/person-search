//app/actions/actions.ts

'use server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from 'next/cache'
import { User, userSchema } from './schemas'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

async function requireAuth() {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        throw new Error("Authentication required")
    }
    return session
}

export async function searchUsers(query: string): Promise<User[]> {
    await requireAuth() // Require authentication

    console.log('Searching users with query:', query)

    const results = await prisma.user.findMany({
        where: {
            name: {
                startsWith: query,
                mode: 'insensitive',
            },
        },
        orderBy: {
            name: 'asc',
        },
    })

    console.log('Search results:', results)
    return results
}

export async function addUser(data: Omit<User, 'id'>): Promise<User> {
    await requireAuth() // Require authentication

    const validatedData = userSchema.omit({ id: true }).parse(data)

    // Handle nullable fields for Prisma
    const createData = {
        name: validatedData.name || "",
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber || "",
        image: validatedData.image || null,
    }

    const newUser = await prisma.user.create({
        data: createData,
    })

    revalidatePath('/')
    return newUser
}

export async function deleteUser(id: string): Promise<void> {
    await requireAuth() // Require authentication

    try {
        await prisma.user.delete({
            where: { id },
        })

        console.log(`User with id ${id} has been deleted.`)
        revalidatePath('/')
    } catch {
        throw new Error(`User with id ${id} not found`)
    }
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
    await requireAuth() // Require authentication

    const validatedData = userSchema.omit({ id: true }).partial().parse(data)

    // Handle nullable fields for Prisma
    const updateData: {
        name?: string
        email?: string
        phoneNumber?: string
        image?: string | null
    } = {}
    if (validatedData.name !== undefined) {
        updateData.name = validatedData.name || ""
    }
    if (validatedData.email !== undefined) {
        updateData.email = validatedData.email
    }
    if (validatedData.phoneNumber !== undefined) {
        updateData.phoneNumber = validatedData.phoneNumber || ""
    }
    if (validatedData.image !== undefined) {
        updateData.image = validatedData.image
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        })

        console.log(`User with id ${id} has been updated.`)
        revalidatePath('/')
        return updatedUser
    } catch {
        throw new Error(`User with id ${id} not found`)
    }
}

export const getUserById = cache(async (id: string) => {
    await requireAuth() // Require authentication

    try {
        const user = await prisma.user.findUnique({
            where: { id },
        })
        return user
    } catch {
        return null
    }
})

export async function getAllUsers(): Promise<User[]> {
    await requireAuth() // Require authentication

    return await prisma.user.findMany({
        orderBy: {
            name: 'asc',
        },
    })
}
