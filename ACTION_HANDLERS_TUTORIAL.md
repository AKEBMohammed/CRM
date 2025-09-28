# 📚 DataTable Action Handlers Tutorial

## 🎯 Overview

This tutorial teaches you how to handle **Info**, **Edit**, and **Delete** actions in your DataTable component. Each action receives the row data and index, allowing you to create rich user experiences.

## 🔧 Basic Implementation Structure

### 1. **Action Handler Functions**

```typescript
// 🎯 INFO ACTION - Shows detailed information about the selected row
function handleInfoAction(rowData: any, rowIndex: number) {
    console.log("Info clicked for:", rowData, "at index:", rowIndex);
    // Store selected data
    selectedUser = rowData;
    selectedUserIndex = rowIndex;
    // Show info modal
    showInfoModal = true;
}

// ✏️ EDIT ACTION - Opens edit form with pre-populated data
function handleEditAction(rowData: any, rowIndex: number) {
    console.log("Edit clicked for:", rowData, "at index:", rowIndex);
    selectedUser = rowData;
    selectedUserIndex = rowIndex;
    
    // Pre-populate edit form
    editFormData = {
        fullname: rowData.fullname || "",
        email: rowData.email || "",
        phone: rowData.phone || "",
        role: rowData.role || "",
    };
    
    showEditModal = true;
}

// 🗑️ DELETE ACTION - Opens confirmation dialog
function handleDeleteAction(rowData: any, rowIndex: number) {
    console.log("Delete clicked for:", rowData, "at index:", rowIndex);
    selectedUser = rowData;
    selectedUserIndex = rowIndex;
    showDeleteModal = true;
}
```

### 2. **DataTable Usage**

```svelte
<DataTable 
    data={data.profiles}
    title="User Management"
    subtitle="Manage your application users"
    onInfo={handleInfoAction}
    onEdit={handleEditAction}
    onDelete={handleDeleteAction}
    onRefresh={handleRefresh}
    onExport={handleExport}
/>
```

## 🎨 Modal Implementations

### 📋 **Info Modal**

**Purpose**: Display read-only information about the selected row

**Features**:
- User avatar with initials
- Role badge with color coding
- Formatted display of all user data
- Professional card layout

**Key Code**:
```svelte
<Modal bind:open={showInfoModal} title="User Information">
    {#if selectedUser}
        <Card>
            <!-- Avatar -->
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <span class="text-white text-xl font-bold">
                    {selectedUser.fullname?.charAt(0)?.toUpperCase() || 'U'}
                </span>
            </div>
            
            <!-- User Data Display -->
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Full Name</label>
                    <p class="bg-gray-50 p-2 rounded">{selectedUser.fullname}</p>
                </div>
                <!-- More fields... -->
            </div>
        </Card>
    {/if}
</Modal>
```

### ✏️ **Edit Modal**

**Purpose**: Allow users to modify row data with a form

**Features**:
- Pre-populated form fields
- Form validation
- Grid layout for better UX
- Submit/Cancel actions

**Key Code**:
```svelte
<Modal bind:open={showEditModal} title="Edit User">
    <form onsubmit={(e) => { e.preventDefault(); confirmEdit(); }}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
                bind:value={editFormData.fullname}
                placeholder="Enter full name"
                required
            />
            <!-- More form fields... -->
        </div>
        
        <div class="flex justify-end space-x-2">
            <Button color="alternative" onclick={() => showEditModal = false}>
                Cancel
            </Button>
            <Button color="blue" type="submit">Update User</Button>
        </div>
    </form>
</Modal>
```

**Edit Confirmation Logic**:
```typescript
function confirmEdit() {
    // Update data (replace with API call in real app)
    if (selectedUserIndex >= 0 && selectedUserIndex < data.profiles.length) {
        data.profiles[selectedUserIndex] = {
            ...data.profiles[selectedUserIndex],
            ...editFormData
        };
    }
    
    // Close modal and show success
    showEditModal = false;
    alert(`User ${editFormData.fullname} updated successfully!`);
}
```

### 🗑️ **Delete Modal**

**Purpose**: Confirm destructive delete action with user details

**Features**:
- Warning styling (red theme)
- User data preview
- Danger alert message
- Confirmation required

**Key Code**:
```svelte
<Modal bind:open={showDeleteModal} title="Confirm Deletion">
    <div class="text-center space-y-4">
        <!-- Warning Icon -->
        <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <TrashBinOutline class="w-8 h-8 text-red-500" />
        </div>
        
        <!-- User Preview -->
        <Card class="bg-gray-50 border-l-4 border-red-500">
            <p><span class="font-medium">Name:</span> {selectedUser.fullname}</p>
            <p><span class="font-medium">Email:</span> {selectedUser.email}</p>
        </Card>
        
        <!-- Warning Alert -->
        <Alert color="red">
            <span class="font-medium">Warning!</span>
            This action cannot be undone.
        </Alert>
        
        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4">
            <Button color="alternative" onclick={() => showDeleteModal = false}>
                Cancel
            </Button>
            <Button color="red" onclick={confirmDelete}>
                Yes, Delete User
            </Button>
        </div>
    </div>
</Modal>
```

**Delete Confirmation Logic**:
```typescript
function confirmDelete() {
    // Remove from data (replace with API call in real app)
    if (selectedUserIndex >= 0) {
        data.profiles.splice(selectedUserIndex, 1);
        data.profiles = [...data.profiles]; // Trigger reactivity
    }
    
    // Close modal and show success
    showDeleteModal = false;
    alert(`User deleted successfully!`);
}
```

## 🚀 Advanced Features

### 📊 **Refresh Handler**
```typescript
function handleRefresh() {
    console.log("Refreshing data...");
    // Make API call to refresh data
    window.location.reload(); // Simple refresh
}
```

### 📤 **Export Handler**
```typescript
function handleExport(exportData: any[]) {
    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
        headers.join(","),
        ...exportData.map(row => headers.map(h => `"${row[h]}"`).join(","))
    ].join("\n");
    
    // Create download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
}
```

## 🎯 **State Management Pattern**

### Required State Variables:
```typescript
// Modal visibility states
let showInfoModal = $state(false);
let showEditModal = $state(false);
let showDeleteModal = $state(false);

// Selected row data
let selectedUser = $state<any>(null);
let selectedUserIndex = $state<number>(-1);

// Edit form data
let editFormData = $state({
    fullname: "",
    email: "",
    phone: "",
    role: "",
});
```

## 🔄 **Data Flow**

1. **User clicks action button** → Handler function called with `rowData` and `rowIndex`
2. **Handler stores data** → Sets `selectedUser` and `selectedUserIndex`
3. **Modal opens** → Shows relevant data and form
4. **User interacts** → Makes changes or confirms action
5. **Action confirmed** → Data updated, modal closed, success message shown

## 💡 **Best Practices**

### ✅ **Do's**:
- Always validate form data before submitting
- Show loading states during API calls
- Provide clear success/error feedback
- Use confirmation dialogs for destructive actions
- Pre-populate edit forms with current data
- Store both row data and index for flexibility

### ❌ **Don'ts**:
- Don't mutate data directly without triggering reactivity
- Don't skip confirmation for delete actions
- Don't forget to reset modal states after actions
- Don't make API calls in the modal components
- Don't forget to handle error states

## 🔗 **Integration with APIs**

Replace the local data manipulation with API calls:

```typescript
// Edit API call example
async function confirmEdit() {
    try {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editFormData)
        });
        
        if (response.ok) {
            // Update local data
            data.profiles[selectedUserIndex] = {
                ...data.profiles[selectedUserIndex],
                ...editFormData
            };
            showEditModal = false;
            // Show success toast
        } else {
            // Handle error
            alert('Failed to update user');
        }
    } catch (error) {
        console.error('Update failed:', error);
        alert('Update failed. Please try again.');
    }
}
```

## 🎨 **Customization Options**

The DataTable component supports many customization options:

```typescript
interface TableProps {
    data: any[];                    // Required: Your data array
    title?: string;                 // Table title
    subtitle?: string;              // Table subtitle  
    loading?: boolean;              // Show loading spinner
    onInfo?: (rowData: any, rowIndex: number) => void;    // Info handler
    onEdit?: (rowData: any, rowIndex: number) => void;    // Edit handler
    onDelete?: (rowData: any, rowIndex: number) => void;  // Delete handler
    onRefresh?: () => void;         // Refresh handler
    onExport?: (data: any[]) => void;  // Export handler
    allowColumnToggle?: boolean;    // Show/hide columns
    allowExport?: boolean;          // Export button
    allowPrint?: boolean;           // Print button
    pageSize?: number;              // Rows per page
    showStats?: boolean;            // Stats bar
}
```

## 🎉 **Complete Example**

Check the `src/routes/(app)/dashboard/users/+page.svelte` file for a complete working example with all action handlers implemented!

---

This tutorial provides everything you need to implement professional-grade CRUD operations with your DataTable component. The modals are beautiful, functional, and provide excellent user experience! 🚀