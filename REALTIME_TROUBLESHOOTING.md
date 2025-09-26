# Supabase Real-time Troubleshooting Guide

## Issues Fixed in Code:
1. ✅ **Channel naming**: Changed from `room:X:messages` to `room-X-messages` (more reliable)
2. ✅ **Event filtering**: Now only listening for INSERT events (more efficient)
3. ✅ **Proper cleanup**: Channel is properly unsubscribed when component unmounts
4. ✅ **Duplicate prevention**: Checks for existing messages before adding
5. ✅ **Better error handling**: Improved message sending with error recovery
6. ✅ **Field consistency**: Handles both `send_at` and `created_at` fields

## Required Supabase Configuration:

### 1. Enable Realtime on Messages Table
In your Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Find the `messages` table
3. Make sure **Realtime** is **enabled** ✅

### 2. Check Row Level Security (RLS)
Go to **Database** → **Tables** → **messages**:
- If RLS is enabled, you need policies that allow:
  - `SELECT` for users in the same room
  - `INSERT` for authenticated users
  - Real-time subscriptions

### 3. Example RLS Policies (if needed):
```sql
-- Allow users to read messages from rooms they have access to
CREATE POLICY "Users can read messages from their rooms" ON messages
FOR SELECT USING (
  room_id IN (
    SELECT room_id FROM profiles_rooms 
    WHERE profile_id = auth.uid()
  )
);

-- Allow users to insert messages to rooms they have access to
CREATE POLICY "Users can insert messages to their rooms" ON messages
FOR INSERT WITH CHECK (
  room_id IN (
    SELECT room_id FROM profiles_rooms 
    WHERE profile_id = auth.uid()
  )
);
```

## Testing Steps:

### 1. Open Browser Console
- Press F12 in both browser windows
- Look for console messages about channel subscription

### 2. Expected Console Output:
```
Setting up channel for room: [room_id]
Channel subscription status: SUBSCRIBED
Successfully subscribed to real-time updates
```

### 3. When Sending Message:
```
Message sent successfully: [message_data]
New message received via real-time: [payload]
Message added. New count: X
```

## Common Issues:

### Issue: "Channel subscription status: CHANNEL_ERROR"
**Solution**: Check if Realtime is enabled for the messages table

### Issue: Messages sent but not received in real-time
**Solution**: Check RLS policies - they might be blocking real-time subscriptions

### Issue: "TIMED_OUT" status
**Solution**: Network/connection issue, try refreshing the page

### Issue: Duplicate messages
**Solution**: Already handled in the updated code with duplicate prevention

## Quick Test:
1. Open same room in 2 different browsers
2. Send message from Browser 1
3. Check Browser 2 console for real-time events
4. Verify message appears in Browser 2 UI