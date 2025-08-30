# Prisma Database Migration Guide

This document provides a step-by-step guide to migrate your person-search application from using an in-memory users array to a Prisma-powered PostgreSQL database.

## Overview

We'll be converting the current in-memory user storage in `app/actions/actions.ts` to use Prisma ORM with PostgreSQL database. The migration includes:
- Setting up Prisma
- Creating database schema
- Migrating existing data
- Updating all CRUD operations

## Prerequisites

- Node.js and pnpm installed
- PostgreSQL database credentials (provided)
- Existing Next.js 15 project structure

## Step-by-Step Migration

### Step 1: Install Prisma Dependencies

```bash
pnpm add prisma @prisma/client
pnpm add -D prisma
```

### Step 2: Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema file
- `.env` - Environment variables file (if it doesn't exist)

### Step 3: Configure Environment Variables

Update or create `.env` file with your database URLs:

```env
# Database URLs - Replace with your actual credentials
POSTGRES_URL="postgres://username:password@host:port/database?sslmode=require"
PRISMA_DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"

# For Prisma Accelerate (if using) - Replace with your actual API key
PRISMA_ACCELERATE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_ACTUAL_API_KEY_HERE"
```

### Step 4: Define Database Schema

Update `prisma/schema.prisma` with the User model:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("PRISMA_DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  phoneNumber String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("users")
}
```

### Step 5: Generate Prisma Client

```bash
npx prisma generate
```

### Step 6: Run Database Migration

```bash
npx prisma db push
```

### Step 7: Create Prisma Client Instance

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 8: Seed Initial Data

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const initialUsers = [
  { name: 'John Doe', phoneNumber: '0412345678', email: 'john@example.com' },
  { name: 'Jane Smith', phoneNumber: '0423456789', email: 'jane@example.com' },
  { name: 'Alice Johnson', phoneNumber: '0434567890', email: 'alice@example.com' },
  { name: 'Bob Williams', phoneNumber: '0445678901', email: 'bob@example.com' },
  { name: 'Charlie Brown', phoneNumber: '0456789012', email: 'charlie@example.com' },
  { name: 'Emily Davis', phoneNumber: '0467890123', email: 'emily@example.com' },
  { name: 'Frank Miller', phoneNumber: '0478901234', email: 'frank@example.com' },
  { name: 'Grace Lee', phoneNumber: '0489012345', email: 'grace@example.com' },
  { name: 'Henry Moore', phoneNumber: '0490123456', email: 'henry@example.com' },
  { name: 'Isabella Young', phoneNumber: '0401234567', email: 'isabella@example.com' },
]

async function main() {
  console.log('Start seeding...')
  
  for (const user of initialUsers) {
    const result = await prisma.user.create({
      data: user,
    })
    console.log(`Created user with id: ${result.id}`)
  }
  
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add seed script to `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Step 9: Install tsx for TypeScript execution

```bash
pnpm add -D tsx
```

### Step 10: Run Seed

```bash
npx prisma db seed
```

### Step 11: Update Actions File

Replace the in-memory operations in `app/actions/actions.ts` with Prisma operations:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { User, userSchema } from './schemas'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

export async function searchUsers(query: string): Promise<User[]> {
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
  const validatedData = userSchema.omit({ id: true }).parse(data)
  
  const newUser = await prisma.user.create({
    data: validatedData,
  })
  
  revalidatePath('/')
  return newUser
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: { id },
    })
    
    console.log(`User with id ${id} has been deleted.`)
    revalidatePath('/')
  } catch (error) {
    throw new Error(`User with id ${id} not found`)
  }
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
  const validatedData = userSchema.omit({ id: true }).partial().parse(data)
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
    })
    
    console.log(`User with id ${id} has been updated.`)
    revalidatePath('/')
    return updatedUser
  } catch (error) {
    throw new Error(`User with id ${id} not found`)
  }
}

export const getUserById = cache(async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    })
    return user
  } catch (error) {
    return null
  }
})

export async function getAllUsers(): Promise<User[]> {
  return await prisma.user.findMany({
    orderBy: {
      name: 'asc',
    },
  })
}
```

### Step 12: Update Schema Types (if needed)

Update `app/actions/schemas.ts` to match Prisma model:

```typescript
import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phoneNumber: z.string().regex(/^04\d{8}$/, { message: "Phone number must be a valid Australian mobile number (e.g., 0422018632)." }),
})

export type User = z.infer<typeof userSchema>

export const userFormSchema = userSchema.omit({ id: true })
export type UserFormData = z.infer<typeof userFormSchema>
```

### Step 13: Test the Migration

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Test all CRUD operations:
   - Search for users
   - Add a new user
   - Edit existing users
   - Delete users

### Step 14: Database Management Commands

Useful Prisma commands for ongoing development:

```bash
# View database in browser
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate client after schema changes
npx prisma generate

# View current database
npx prisma db pull
```

## Verification Checklist

- [ ] Prisma dependencies installed
- [ ] Environment variables configured
- [ ] Database schema defined
- [ ] Prisma client generated
- [ ] Database migrated
- [ ] Initial data seeded
- [ ] Actions file updated
- [ ] Application tested
- [ ] All CRUD operations working

## Troubleshooting

### Common Issues:

1. **Connection Issues**: Verify database URLs in `.env`
2. **Schema Errors**: Check `prisma/schema.prisma` syntax
3. **Type Errors**: Run `npx prisma generate` after schema changes
4. **Seed Errors**: Ensure unique constraints are respected

### Useful Debug Commands:

```bash
# Check database connection
npx prisma db execute --stdin <<< "SELECT 1"

# View generated client
npx prisma generate --preview-feature

# Reset and reseed database
npx prisma migrate reset
```

## Next Steps

After successful migration:
1. Add database indexes for better search performance
2. Implement proper error handling
3. Add data validation at the database level
4. Consider implementing soft deletes
5. Add audit trails if needed

## Security Considerations

1. Never commit `.env` file with real credentials
2. Use connection pooling for production
3. Implement proper authentication
4. Add rate limiting for API endpoints
5. Validate all user inputs