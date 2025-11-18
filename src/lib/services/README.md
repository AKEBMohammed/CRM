# CRM Services Documentation

This document provides a comprehensive guide to the CRM service architecture implemented for your Supabase-based CRM system.

## 🏗️ Service Architecture

The service layer provides a clean abstraction between your Svelte components and the Supabase database. Each service follows a consistent pattern with CRUD operations and business-specific methods.

### 📁 Service Files

- `companies.service.ts` - Company management
- `contacts.service.ts` - Customer contact management  
- `deals.service.ts` - Sales pipeline management
- `products.service.ts` - Product catalog management
- `tasks.service.ts` - Task and workflow management
- `interactions.service.ts` - Customer interaction tracking
- `profiles.service.ts` - Team member management
- `rooms.service.ts` - Team chat and messaging
- `discussions.service.ts` - AI assistant conversations
- `index.ts` - Central exports and convenience patterns

## 🔧 Usage Examples

### Import Options

```typescript
// Option 1: Import specific services
import { contactsService, dealsService } from '$lib/services';

// Option 2: Import with namespace
import { Contacts, Deals } from '$lib/services';

// Option 3: Import all services object
import { services } from '$lib/services';
```

### Basic CRUD Operations

```typescript
// Create a new contact
const newContact = await contactsService.create({
    fullname: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company_id: 28,
    created_by: 52
});

// Get all contacts for a company
const contacts = await contactsService.getAll(28);

// Update contact
const updated = await contactsService.update(contactId, {
    phone: '+1987654321'
});

// Delete contact
await contactsService.delete(contactId);
```

### Advanced Business Logic

```typescript
// Get deal pipeline statistics
const pipelineStats = await dealsService.getPipelineStats(companyId);

// Get overdue tasks
const overdueTasks = await tasksService.getOverdue(profileId);

// Search contacts
const searchResults = await contactsService.search(companyId, 'john');

// Get team performance
const teamStats = await profilesService.getTeamStats(companyId);
```

## 🎯 Service Features

### 1. **Companies Service**
- Company CRUD operations
- Company contact management
- Multi-tenant isolation

### 2. **Contacts Service**
- Contact management with relationships
- Search and filtering
- Statistics and analytics
- Deal and task associations

### 3. **Deals Service**
- Complete sales pipeline management
- Stage progression tracking
- Performance analytics
- Contact and product relationships

### 4. **Products Service**
- Product catalog management
- Performance metrics
- Deal associations
- Revenue tracking

### 5. **Tasks Service**
- Task assignment and tracking
- Status management
- Due date handling
- Deal and contact associations

### 6. **Interactions Service**
- Customer touchpoint tracking
- Interaction type management
- Deal associations
- Timeline and analytics

### 7. **Profiles Service**
- Team member management
- Role-based access
- Performance metrics
- User search and statistics

### 8. **Rooms Service**
- Team chat room management
- Member management
- Room permissions

### 9. **Messages Service**
- Real-time messaging
- Message threading
- File attachments
- Read receipts

### 10. **Discussions Service**
- AI conversation management
- Chat history
- Title generation integration

## 📊 Data Relationships

The services handle complex relationships automatically:

```typescript
// Get contact with all related data
const contact = await contactsService.getById(contactId);
// Returns: contact + deals + tasks + interactions

// Get deal with full context
const deal = await dealsService.getById(dealId);
// Returns: deal + contact + product + owner + interactions + tasks
```

## 🔐 Multi-Tenant Security

All services respect company-based multi-tenancy:

```typescript
// All queries are automatically scoped to company
const contacts = await contactsService.getAll(company_id);
const deals = await dealsService.getAll(profile_id, company_id);
```

## 🚀 Performance Features

- **Efficient Queries**: Optimized Supabase queries with proper relationships
- **Selective Loading**: Only fetch needed data
- **Error Handling**: Comprehensive error management
- **Type Safety**: Full TypeScript support

## 📈 Analytics and Reporting

Services include built-in analytics methods:

```typescript
// Contact statistics
const contactStats = await contactsService.getStats(companyId);

// Deal pipeline analytics
const pipelineData = await dealsService.getPipelineStats(companyId);

// Task completion metrics
const taskMetrics = await tasksService.getStats(profileId);

// Team performance
const teamPerformance = await profilesService.getTeamStats(companyId);
```

## 🔄 Integration with Svelte

### In Page Components

```typescript
// +page.server.ts
import { contactsService } from '$lib/services';

export const load = async () => {
    const contacts = await contactsService.getAll(companyId);
    return { contacts };
};
```

### In Client Components

```typescript
// Component.svelte
<script lang="ts">
    import { contactsService } from '$lib/services';
    
    async function createContact() {
        const newContact = await contactsService.create(contactData);
        // Handle success
    }
</script>
```

## 🛡️ Error Handling

All services throw meaningful errors:

```typescript
try {
    const contact = await contactsService.getById(contactId);
} catch (error) {
    console.error('Failed to fetch contact:', error);
    // Handle error appropriately
}
```

## 🔧 Customization

Services can be extended for specific business needs:

```typescript
// Extend existing service
const extendedContactsService = {
    ...contactsService,
    
    async getVIPContacts(companyId: number) {
        // Custom business logic
        const contacts = await this.getAll(companyId);
        return contacts.filter(contact => contact.vip_status);
    }
};
```

## 📝 Best Practices

1. **Always use services** instead of direct Supabase calls in components
2. **Respect company_id** for multi-tenant security
3. **Handle errors gracefully** with try-catch blocks
4. **Use TypeScript types** for better development experience
5. **Leverage analytics methods** for dashboard components
6. **Cache results** when appropriate for performance

This service architecture provides a robust, type-safe, and scalable foundation for your CRM application! 🎉