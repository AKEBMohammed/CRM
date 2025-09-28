# 🔧 Self-Contained DataTable Usage Guide

## 🎯 Overview

The DataTable component now handles all UI interactions internally and only requires form action URLs for server-side operations. This makes it much easier to use - you just pass the form actions and the component handles the rest!

## 📋 **Component Interface**

```typescript
interface TableProps {
    data: any[];                    // Required: Your data array
    title?: string;                 // Table title
    subtitle?: string;              // Table subtitle
    loading?: boolean;              // Show loading state
    editAction?: string;            // Form action URL for edit (e.g., "?/edit")
    deleteAction?: string;          // Form action URL for delete (e.g., "?/delete")
    onRefresh?: () => void;         // Optional refresh callback
    onExport?: (data: any[]) => void;  // Optional export callback
    allowColumnToggle?: boolean;    // Show/hide columns feature
    allowExport?: boolean;          // Export functionality
    allowPrint?: boolean;           // Print functionality
    pageSize?: number;              // Rows per page
    showStats?: boolean;            // Stats bar
}
```

## 🚀 **Basic Usage**

### 1. **Component Usage in Page**

```svelte
<!-- src/routes/users/+page.svelte -->
<script lang="ts">
    import DataTable from "$lib/components/DataTable.svelte";

    let { data } = $props();

    function handleRefresh() {
        window.location.reload();
    }

    function handleExport(exportData: any[]) {
        // Convert to CSV and download
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
            headers.join(","),
            ...exportData.map(row => headers.map(h => `"${row[h]}"`).join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "export.csv";
        a.click();
    }
</script>

<DataTable
    data={data.users}
    title="User Management"
    subtitle="Manage your application users"
    editAction="?/edit"
    deleteAction="?/delete"
    onRefresh={handleRefresh}
    onExport={handleExport}
    pageSize={10}
    showStats={true}
/>
```

### 2. **Server Actions Setup**

```typescript
// src/routes/users/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
    // Edit user action
    edit: async ({ request, cookies }) => {
        const user = JSON.parse(cookies.get('user') || 'null');
        
        if (!user || user.role !== 'admin') {
            return fail(401, { error: 'Unauthorized access' });
        }

        const formData = await request.formData();
        const id = formData.get('id') as string;
        const fullname = formData.get('fullname') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const role = formData.get('role') as string;

        try {
            // Update user in database
            await updateUser(id, { fullname, email, phone, role });
            
            return {
                success: `User ${fullname} updated successfully!`
            };
        } catch (error) {
            return fail(500, { error: 'Failed to update user' });
        }
    },

    // Delete user action
    delete: async ({ request, cookies }) => {
        const user = JSON.parse(cookies.get('user') || 'null');
        
        if (!user || user.role !== 'admin') {
            return fail(401, { error: 'Unauthorized access' });
        }

        const formData = await request.formData();
        const id = formData.get('id') as string;
        const fullname = formData.get('fullname') as string;

        try {
            // Delete user from database
            await deleteUser(id);
            
            return {
                success: `User ${fullname} deleted successfully!`
            };
        } catch (error) {
            return fail(500, { error: 'Failed to delete user' });
        }
    }
} satisfies Actions;
```

## 🎨 **Built-in Features**

### **✨ What the Component Handles Automatically:**

1. **🔍 Info Modal**
   - Beautiful user info display
   - User avatar with initials
   - Role badges
   - All user data formatted nicely

2. **✏️ Edit Modal**
   - Pre-populated form fields
   - Form validation
   - Professional grid layout
   - Automatic form submission to your action

3. **🗑️ Delete Modal**
   - Confirmation dialog
   - User data preview
   - Warning messages
   - Safe deletion process

4. **📊 Advanced Table Features**
   - Search across all columns
   - Column filtering
   - Sorting (ascending/descending)
   - Pagination
   - Row selection (single/bulk)
   - Column visibility toggle

5. **🎯 Additional Features**
   - Loading states
   - Empty states
   - Export functionality
   - Print support
   - Statistics dashboard
   - Responsive design

## 🔧 **Form Data Structure**

### **Edit Form Sends:**
```javascript
FormData {
    id: "123" or row index,
    fullname: "John Doe",
    email: "john@example.com", 
    phone: "555-0123",
    role: "admin"
}
```

### **Delete Form Sends:**
```javascript
FormData {
    id: "123" or row index,
    fullname: "John Doe",  // For confirmation message
    email: "john@example.com"
}
```

## 🎨 **Visual Features**

### **Info Modal:**
- 🎨 Gradient user avatar with initials
- 🏷️ Color-coded role badges
- 📋 Clean data display with labeled fields
- 📍 Row index information

### **Edit Modal:**
- 📝 Pre-populated form fields
- 🗂️ Responsive grid layout
- ✅ Form validation
- ℹ️ Contextual information display

### **Delete Modal:**
- ⚠️ Warning styling (red theme)
- 👤 User data preview card
- 🚨 Danger alerts
- 🔒 Confirmation required

## 🚀 **Advanced Usage**

### **Custom Data Types:**
The component automatically handles:
- **Booleans**: Displayed as colored badges (Yes/No)
- **Numbers**: Formatted with locale formatting
- **Strings**: Truncated with tooltip on hover

### **Responsive Design:**
- Mobile-friendly pagination
- Collapsible search and filters
- Touch-friendly buttons
- Responsive modals

### **Accessibility:**
- Proper ARIA labels
- Keyboard navigation
- High contrast colors
- Screen reader support

## 📦 **Server Integration Examples**

### **With Supabase:**
```typescript
export const actions = {
    edit: async ({ request }) => {
        const formData = await request.formData();
        const updates = Object.fromEntries(formData);
        
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', updates.id);
            
        if (error) {
            return fail(500, { error: 'Update failed' });
        }
        
        return { success: 'User updated!' };
    }
};
```

### **With Prisma:**
```typescript
export const actions = {
    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        
        try {
            await prisma.user.delete({
                where: { id: parseInt(id) }
            });
            
            return { success: 'User deleted!' };
        } catch (error) {
            return fail(500, { error: 'Delete failed' });
        }
    }
};
```

## 🎯 **Benefits of This Approach**

### **✅ Advantages:**

1. **🧩 Self-Contained**: Component handles all UI logic internally
2. **🔌 Simple Integration**: Just pass form action URLs
3. **🎨 Professional UI**: Beautiful, consistent modals and interactions  
4. **🛡️ Server-Side Safety**: All operations happen on the server
5. **📱 Responsive**: Works great on all devices
6. **♿ Accessible**: Built with accessibility in mind
7. **🔄 Progressive Enhancement**: Works with or without JavaScript

### **🎨 UI/UX Features:**

- Modern card-based layouts
- Smooth animations and transitions
- Color-coded feedback (success/error)
- Professional form designs
- Intuitive user interactions
- Loading states and feedback

## 🎉 **Complete Example**

Check out the implementation in:
- `src/lib/components/DataTable.svelte` - The component
- `src/routes/(app)/dashboard/users/+page.svelte` - Usage example
- `src/routes/(app)/dashboard/users/+page.server.ts` - Server actions

The component now provides a complete, professional data management experience with minimal setup required! 🚀✨