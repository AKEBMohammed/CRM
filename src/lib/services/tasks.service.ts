import { supabase } from '$lib/supabase';

export const tasksService = {
    // Get all tasks for a user or company
    async getAll(profile_id: number, company_id?: number) {
        let query = supabase
            .from('tasks')
            .select(`
                *,
                deal:deals(title, value, stage),
                contact:contacts(fullname, email),
                assignee:profiles!assigned_to(fullname, email),
                creator:profiles!created_by(fullname, email)
            `);

        if (company_id) {
            // Get all tasks for company (admin view)
            query = query.eq('creator.company_id', company_id);
        } else {
            // Get tasks assigned to or created by user
            query = query.or(`assigned_to.eq.${profile_id},created_by.eq.${profile_id}`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get task by ID
    async getById(task_id: number) {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                deal:deals(title, value, stage, contact:contacts(fullname)),
                contact:contacts(fullname, email, phone),
                assignee:profiles!assigned_to(fullname, email, role),
                creator:profiles!created_by(fullname, email, role)
            `)
            .eq('task_id', task_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create task
    async create(task_data: {
        title: string;
        description?: string;
        priority?: string;
        status?: string;
        type?: string;
        due_date?: string;
        assigned_to?: number;
        created_by: number;
        deal_id?: number;
        contact_id?: number;
    }) {
        const { data, error } = await supabase
            .from('tasks')
            .insert(task_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update task
    async update(task_id: number, updates: Partial<{
        title: string;
        description: string;
        priority: string;
        status: string;
        type: string;
        due_date: string;
        assigned_to: number;
        deal_id: number;
        contact_id: number;
    }>) {
        const updatedData = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('tasks')
            .update(updatedData)
            .eq('task_id', task_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete task
    async delete(task_id: number) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('task_id', task_id);

        if (error) throw error;
        return true;
    },

    // Mark task as completed
    async markCompleted(task_id: number) {
        const { data, error } = await supabase
            .from('tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('task_id', task_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get tasks by status
    async getByStatus(profile_id: number, status: string) {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                deal:deals(title, value),
                contact:contacts(fullname),
                assignee:profiles!assigned_to(fullname)
            `)
            .or(`assigned_to.eq.${profile_id},created_by.eq.${profile_id}`)
            .eq('status', status)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Get overdue tasks
    async getOverdue(profile_id: number) {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                deal:deals(title, value),
                contact:contacts(fullname),
                assignee:profiles!assigned_to(fullname)
            `)
            .or(`assigned_to.eq.${profile_id},created_by.eq.${profile_id}`)
            .lt('due_date', today)
            .neq('status', 'completed')
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Get upcoming tasks (next 7 days)
    async getUpcoming(profile_id: number) {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                deal:deals(title, value),
                contact:contacts(fullname),
                assignee:profiles!assigned_to(fullname)
            `)
            .or(`assigned_to.eq.${profile_id},created_by.eq.${profile_id}`)
            .gte('due_date', today.toISOString().split('T')[0])
            .lte('due_date', nextWeek.toISOString().split('T')[0])
            .neq('status', 'completed')
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Get task statistics
    async getStats(profile_id: number) {
        const { data, error } = await supabase
            .from('tasks')
            .select('status, priority, due_date, created_at')
            .or(`assigned_to.eq.${profile_id},created_by.eq.${profile_id}`);

        if (error) throw error;

        const total = data?.length || 0;
        const completed = data?.filter(task => task.status === 'completed').length || 0;
        const pending = data?.filter(task => task.status === 'pending').length || 0;
        const inProgress = data?.filter(task => task.status === 'in_progress').length || 0;

        const today = new Date().toISOString().split('T')[0];
        const overdue = data?.filter(task => 
            task.due_date && task.due_date < today && task.status !== 'completed'
        ).length || 0;

        const highPriority = data?.filter(task => task.priority === 'high').length || 0;

        return {
            total,
            completed,
            pending,
            inProgress,
            overdue,
            highPriority,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0'
        };
    },

    // Assign task to user
    async assignTo(task_id: number, assigned_to: number) {
        const { data, error } = await supabase
            .from('tasks')
            .update({
                assigned_to,
                updated_at: new Date().toISOString()
            })
            .eq('task_id', task_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get analytics data for tasks
    async getAnalytics(profile_id: number, user_company_id: number) {
        // Get tasks for the specific user or all company users based on role
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
                *,
                deal:deals(title, value),
                contact:contacts(fullname),
                assignee:profiles!assigned_to(fullname),
                creator:profiles!created_by(fullname)
            `)
            .or(`assigned_to.eq.${profile_id},created_by.eq.${profile_id}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const total = tasks?.length || 0;
        const completed = tasks?.filter(task => task.status === 'completed').length || 0;
        const pending = tasks?.filter(task => 
            task.status === 'pending' || task.status === 'in_progress').length || 0;

        // Get overdue tasks
        const today = new Date();
        const overdue = tasks?.filter(task => {
            const dueDate = task.due_date ? new Date(task.due_date) : null;
            return dueDate && dueDate < today && task.status !== 'completed';
        }) || [];

        // Get upcoming tasks (next 7 days)
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcoming = tasks?.filter(task => {
            const dueDate = task.due_date ? new Date(task.due_date) : null;
            return dueDate && dueDate >= today && dueDate <= nextWeek && task.status !== 'completed';
        })
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 10) || [];

        // Group by status
        const statusStats: { [key: string]: number } = {};
        tasks?.forEach(task => {
            const status = task.status || 'unknown';
            statusStats[status] = (statusStats[status] || 0) + 1;
        });
        const byStatus = Object.entries(statusStats).map(([status, count]) => ({ status, count }));

        // Group by priority
        const priorityStats: { [key: string]: number } = {};
        tasks?.forEach(task => {
            const priority = task.priority || 'medium';
            priorityStats[priority] = (priorityStats[priority] || 0) + 1;
        });
        const byPriority = Object.entries(priorityStats).map(([priority, count]) => ({ priority, count }));

        return {
            total,
            completed,
            pending,
            overdue: overdue, // Return array instead of length
            upcoming,
            byStatus,
            byPriority,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0'
        };
    }
};