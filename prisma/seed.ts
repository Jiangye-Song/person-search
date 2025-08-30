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