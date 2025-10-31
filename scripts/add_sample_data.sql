-- Sample data for CRM Analytics Dashboard
-- This script adds sample data to test the analytics functionality

-- Sample Contacts
INSERT INTO contacts (fullname, email, phone, title, company_id, created_by, created_at)
VALUES 
('John Smith', 'john.smith@example.com', '+1234567890', 'CEO', 28, 52, NOW() - INTERVAL '30 days'),
('Sarah Johnson', 'sarah.johnson@example.com', '+1234567891', 'Marketing Director', 28, 52, NOW() - INTERVAL '25 days'),
('Mike Davis', 'mike.davis@example.com', '+1234567892', 'CTO', 28, 52, NOW() - INTERVAL '20 days'),
('Lisa Wilson', 'lisa.wilson@example.com', '+1234567893', 'Sales Manager', 28, 52, NOW() - INTERVAL '15 days'),
('Tom Brown', 'tom.brown@example.com', '+1234567894', 'Product Manager', 28, 52, NOW() - INTERVAL '10 days');

-- Sample Products
INSERT INTO products (name, description, unit_price, company_id, created_by, created_at)
VALUES 
('AI Chatbot Pro', 'Advanced AI chatbot solution for customer service', 2999.99, 28, 52, NOW() - INTERVAL '45 days'),
('Machine Learning Platform', 'Complete ML platform for data scientists', 4999.99, 28, 52, NOW() - INTERVAL '40 days'),
('Data Analytics Suite', 'Comprehensive data analytics and visualization tools', 1999.99, 28, 52, NOW() - INTERVAL '35 days'),
('AI Consulting Services', 'Expert AI implementation consulting', 500.00, 28, 52, NOW() - INTERVAL '30 days');

-- Sample Deals
INSERT INTO deals (title, description, value, stage, probability, company_id, profile_id, created_at, updated_at)
VALUES 
('Enterprise AI Implementation', 'Large scale AI implementation for Fortune 500 company', 150000.00, 'negotiation', 75, 28, 52, NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),
('Startup ML Platform', 'Machine learning platform for growing startup', 25000.00, 'proposal', 60, 28, 52, NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days'),
('Government Data Analytics', 'Data analytics solution for government agency', 75000.00, 'qualified', 40, 28, 52, NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'),
('Retail Chatbot Solution', 'Customer service chatbot for retail chain', 45000.00, 'lead', 30, 28, 52, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
('Healthcare AI Consulting', 'AI consulting for healthcare organization', 80000.00, 'closed_won', 100, 28, 52, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
('Small Business Analytics', 'Analytics dashboard for small business', 12000.00, 'closed_won', 100, 28, 52, NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days');

-- Sample Interactions
INSERT INTO interactions (type, note, company_id, created_by, created_at)
VALUES 
('call', 'Initial discovery call with Enterprise client. Very interested in AI implementation.', 28, 52, NOW() - INTERVAL '18 days'),
('email', 'Sent proposal document to Startup ML Platform prospect.', 28, 52, NOW() - INTERVAL '13 days'),
('meeting', 'Demo session with Government Data Analytics team. Positive feedback.', 28, 52, NOW() - INTERVAL '8 days'),
('call', 'Follow-up call with Retail Chatbot prospect. Addressing technical questions.', 28, 52, NOW() - INTERVAL '5 days'),
('meeting', 'Contract signing meeting for Healthcare AI Consulting project.', 28, 52, NOW() - INTERVAL '4 days');

-- Sample Messages (if rooms exist)
INSERT INTO messages (content, send_at, profile_id, room_id, company_id)
VALUES 
('Welcome to the DZAI team chat! 🚀', NOW() - INTERVAL '7 days', 52, 21, 28),
('Great work on the Healthcare AI project everyone!', NOW() - INTERVAL '5 days', 52, 21, 28),
('Preparing for the Enterprise AI demo next week', NOW() - INTERVAL '3 days', 52, 21, 28),
('Q4 targets are looking good with our current pipeline', NOW() - INTERVAL '2 days', 52, 21, 28),
('New analytics dashboard is ready for testing', NOW() - INTERVAL '1 day', 52, 21, 28);

-- Update some tasks with deal associations (if deal_id column exists)
-- Note: This might need to be adjusted based on your actual task table structure
UPDATE tasks 
SET status = 'completed', 
    completed_at = NOW() - INTERVAL '5 days'
WHERE task_id IN (
    SELECT task_id FROM tasks 
    WHERE created_by = 52 OR assigned_to = 52 
    LIMIT 5
);

UPDATE tasks 
SET status = 'in_progress'
WHERE task_id IN (
    SELECT task_id FROM tasks 
    WHERE (created_by = 52 OR assigned_to = 52) 
    AND status = 'pending'
    LIMIT 3
);