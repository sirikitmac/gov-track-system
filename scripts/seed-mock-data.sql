-- =====================================================
-- COMPREHENSIVE DATABASE SEED SCRIPT (1000+ Records)
-- Fixed to match actual database schema
-- =====================================================

-- Helper function to generate random dates
CREATE OR REPLACE FUNCTION random_date(start_date DATE, end_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN start_date + (random() * (end_date - start_date))::INT;
END;
$$ LANGUAGE plpgsql;

-- Helper function to generate random phone numbers
CREATE OR REPLACE FUNCTION random_phone()
RETURNS TEXT AS $$
BEGIN
  RETURN '09' || LPAD((random() * 999999999)::BIGINT::TEXT, 9, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. CONTRACTORS (100 contractors)
-- =====================================================
DO $$
DECLARE
  i INT;
  company_types TEXT[] := ARRAY['Construction Corp.', 'Builders Inc.', 'Contractors Ltd.', 'Engineering Services', 'Infrastructure Co.'];
  cities TEXT[] := ARRAY['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Caloocan', 'Paranaque', 'Las Pinas', 'Mandaluyong', 'San Juan'];
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO contractors (
      company_name, contact_person, email, phone, 
      address, city, tin, registration_number, contact_address, created_at
    ) VALUES (
      CASE (i % 5) 
        WHEN 0 THEN 'Alpha'
        WHEN 1 THEN 'Beta'
        WHEN 2 THEN 'Gamma'
        WHEN 3 THEN 'Delta'
        ELSE 'Omega'
      END || ' ' || company_types[(i % array_length(company_types, 1)) + 1],
      CASE (i % 3)
        WHEN 0 THEN 'Juan'
        WHEN 1 THEN 'Maria'
        ELSE 'Pedro'
      END || ' ' || 
      CASE (i % 4)
        WHEN 0 THEN 'Santos'
        WHEN 1 THEN 'Reyes'
        WHEN 2 THEN 'Cruz'
        ELSE 'Garcia'
      END,
      'contractor' || i || '@company.ph',
      random_phone(),
      (100 + i) || ' Main Street, Business District',
      cities[(i % array_length(cities, 1)) + 1],
      LPAD((100000000 + i)::TEXT, 12, '0') || '-' || LPAD((1000 + i)::TEXT, 5, '0'),
      'REG-' || LPAD(i::TEXT, 6, '0'),
      (100 + i) || ' Contact Address, Business District',
      random_date('2020-01-01'::DATE, '2024-01-01'::DATE)
    );
  END LOOP;
END $$;

-- =====================================================
-- 2. PROJECTS (500 projects across all statuses)
-- =====================================================
DO $$
DECLARE
  i INT;
  project_categories TEXT[] := ARRAY['Infrastructure', 'Education', 'Health', 'Agriculture', 'Social_Welfare', 'Environment'];
  barangays TEXT[] := ARRAY[
    'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
    'San Jose', 'San Pedro', 'San Miguel', 'Santa Cruz', 'Santa Maria',
    'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Maligaya', 'Masaya',
    'New Era', 'Victory', 'Sunrise', 'Sunset', 'Riverside'
  ];
  statuses project_status[] := ARRAY['Pending_Review', 'Prioritized', 'Funded', 'Open_For_Bidding', 'In_Progress', 'Completed']::project_status[];
  user_ids UUID[];
  planner_id UUID;
  contractor_ids UUID[];
  contractor_id UUID;
  estimated_cost NUMERIC;
  base_title TEXT;
  current_status project_status;
BEGIN
  -- Get planner user IDs
  SELECT ARRAY_AGG(id) INTO user_ids FROM users WHERE role IN ('Planner', 'System_Administrator');
  
  IF array_length(user_ids, 1) IS NULL OR array_length(user_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No Planner or System_Administrator users found. Please create at least one user with these roles first.';
  END IF;
  
  -- Get contractor IDs
  SELECT ARRAY_AGG(id) INTO contractor_ids FROM contractors LIMIT 50;
  
  FOR i IN 1..500 LOOP
    planner_id := user_ids[(i % array_length(user_ids, 1)) + 1];
    estimated_cost := (RANDOM() * 50000000 + 500000)::NUMERIC(12,2);
    current_status := statuses[(i % array_length(statuses, 1)) + 1];
    
    -- Assign contractor if project is funded or in progress
    IF current_status IN ('In_Progress', 'Completed') AND array_length(contractor_ids, 1) > 0 THEN
      contractor_id := contractor_ids[(i % array_length(contractor_ids, 1)) + 1];
    ELSE
      contractor_id := NULL;
    END IF;
    
    base_title := CASE (i % 10)
      WHEN 0 THEN 'Construction of Barangay Road'
      WHEN 1 THEN 'Rehabilitation of Multi-Purpose Hall'
      WHEN 2 THEN 'Installation of Solar Street Lights'
      WHEN 3 THEN 'Construction of Day Care Center'
      WHEN 4 THEN 'Water System Improvement'
      WHEN 5 THEN 'Construction of Basketball Court'
      WHEN 6 THEN 'Drainage System Installation'
      WHEN 7 THEN 'Construction of Health Station'
      WHEN 8 THEN 'Farm-to-Market Road'
      ELSE 'Electrification Project'
    END;
    
    INSERT INTO projects (
      title, description, barangay, project_category,
      estimated_cost, approved_budget_amount, amount_disbursed, fund_source_code,
      status, problem_description, proposed_solution,
      contractor_id, contract_amount,
      start_date, end_date, expected_completion_date,
      created_by, created_at, updated_at
    ) VALUES (
      base_title || ' - ' || barangays[(i % array_length(barangays, 1)) + 1],
      'This project aims to improve the quality of life of residents through sustainable infrastructure development. ' ||
      'The project includes planning, design, procurement, construction, and monitoring phases. ' ||
      'Expected to benefit approximately ' || (RANDOM() * 5000 + 500)::INT || ' residents.',
      barangays[(i % array_length(barangays, 1)) + 1],
      project_categories[(i % array_length(project_categories, 1)) + 1],
      estimated_cost,
      CASE WHEN current_status IN ('Funded', 'Open_For_Bidding', 'In_Progress', 'Completed') 
           THEN (estimated_cost * (0.9 + RANDOM() * 0.2))::NUMERIC(12,2) 
           ELSE NULL END,
      CASE WHEN current_status IN ('In_Progress', 'Completed')
           THEN (estimated_cost * RANDOM() * 0.8)::NUMERIC(12,2)
           ELSE 0 END,
      CASE WHEN current_status IN ('Funded', 'Open_For_Bidding', 'In_Progress', 'Completed')
           THEN 'FSC-' || LPAD((i % 50)::TEXT, 4, '0')
           ELSE NULL END,
      current_status,
      'Current infrastructure is inadequate and requires improvement to serve the community better. Residents face challenges in daily activities.',
      'Proposed solution includes modern design, quality materials, proper project management, and community involvement.',
      contractor_id,
      CASE WHEN contractor_id IS NOT NULL 
           THEN (estimated_cost * (0.85 + RANDOM() * 0.15))::NUMERIC(12,2)
           ELSE NULL END,
      CASE WHEN current_status IN ('In_Progress', 'Completed')
           THEN random_date('2024-01-01'::DATE, '2024-06-30'::DATE)
           ELSE NULL END,
      CASE WHEN current_status IN ('In_Progress', 'Completed')
           THEN random_date('2024-07-01'::DATE, '2025-12-31'::DATE)
           ELSE NULL END,
      random_date('2024-07-01'::DATE, '2025-12-31'::DATE),
      planner_id,
      random_date('2023-01-01'::DATE, '2024-11-01'::DATE),
      NOW()
    );
  END LOOP;
END $$;

-- =====================================================
-- 3. BID INVITATIONS (200 invitations for funded projects)
-- =====================================================
DO $$
DECLARE
  i INT;
  project_ids UUID[];
  bac_user_id UUID;
BEGIN
  -- Get projects that are Open_For_Bidding or Funded
  SELECT ARRAY_AGG(id) INTO project_ids FROM projects 
  WHERE status IN ('Open_For_Bidding', 'Funded') LIMIT 200;
  
  -- Get BAC user
  SELECT id INTO bac_user_id FROM users WHERE role = 'BAC_Secretariat' LIMIT 1;
  
  IF bac_user_id IS NULL THEN
    SELECT id INTO bac_user_id FROM users WHERE role = 'System_Administrator' LIMIT 1;
  END IF;
  
  IF array_length(project_ids, 1) > 0 THEN
    FOR i IN 1..array_length(project_ids, 1) LOOP
      INSERT INTO bid_invitations (
        project_id, title, description,
        bid_opening_date, bid_closing_date, pre_bid_conference_date,
        requirements, created_by, created_at, updated_at
      ) VALUES (
        project_ids[i],
        'Invitation to Bid - Project #' || i,
        'The Local Government Unit invites qualified contractors to submit their bids for the project. ' ||
        'All bidders must comply with the requirements and submit complete documents.',
        random_date('2024-01-01'::DATE, '2024-03-01'::DATE),
        random_date('2024-03-15'::DATE, '2024-06-30'::DATE),
        random_date('2024-01-15'::DATE, '2024-02-28'::DATE),
        'Valid business permit, PhilGEPS registration, tax clearance, financial statements, technical documents',
        bac_user_id,
        random_date('2023-12-01'::DATE, '2024-01-01'::DATE),
        NOW()
      );
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 4. BIDS (400+ bids from contractors)
-- =====================================================
DO $$
DECLARE
  i INT;
  project_ids UUID[];
  contractor_ids UUID[];
  project_id UUID;
  contractor_id UUID;
  estimated_cost NUMERIC;
  bid_amount NUMERIC;
BEGIN
  SELECT ARRAY_AGG(id) INTO project_ids FROM projects 
  WHERE status IN ('Open_For_Bidding', 'Funded', 'In_Progress');
  
  SELECT ARRAY_AGG(id) INTO contractor_ids FROM contractors;
  
  IF array_length(project_ids, 1) > 0 AND array_length(contractor_ids, 1) > 0 THEN
    FOR i IN 1..400 LOOP
      project_id := project_ids[(i % array_length(project_ids, 1)) + 1];
      contractor_id := contractor_ids[(i % array_length(contractor_ids, 1)) + 1];
      
      SELECT p.estimated_cost INTO estimated_cost FROM projects p WHERE p.id = project_id;
      bid_amount := (estimated_cost * (0.85 + RANDOM() * 0.3))::NUMERIC(12,2);
      
      INSERT INTO bids (
        project_id, contractor_id, bid_amount, bid_date,
        is_winning_bid, created_at, updated_at
      ) VALUES (
        project_id,
        contractor_id,
        bid_amount,
        random_date('2024-03-01'::DATE, '2024-06-30'::DATE),
        (i % 5 = 0), -- Every 5th bid is a winning bid
        random_date('2024-03-01'::DATE, '2024-06-30'::DATE),
        NOW()
      );
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 5. MILESTONES (600+ milestones for active projects)
-- =====================================================
DO $$
DECLARE
  i INT;
  project_record RECORD;
  milestone_count INT;
  milestone_titles TEXT[] := ARRAY[
    'Site Mobilization',
    'Foundation Work',
    'Structural Work',
    'Finishing Work',
    'Final Inspection',
    'Project Turnover'
  ];
  statuses milestone_status[] := ARRAY['Not_Started', 'In_Progress', 'Completed', 'Delayed']::milestone_status[];
BEGIN
  FOR project_record IN 
    SELECT id, start_date, end_date FROM projects 
    WHERE status IN ('In_Progress', 'Completed')
  LOOP
    milestone_count := 4 + (RANDOM() * 3)::INT;
    
    FOR i IN 1..milestone_count LOOP
      INSERT INTO milestones (
        project_id, title, description,
        percentage_complete, status,
        scheduled_start_date, scheduled_end_date,
        actual_completion_date, order_sequence,
        created_at, updated_at
      ) VALUES (
        project_record.id,
        milestone_titles[(i % array_length(milestone_titles, 1)) + 1] || ' (Phase ' || i || ')',
        'Milestone description for phase ' || i || ' including key deliverables and quality standards.',
        CASE 
          WHEN i <= milestone_count - 2 THEN 100
          WHEN i = milestone_count - 1 THEN (RANDOM() * 100)::INT
          ELSE 0
        END,
        statuses[(i % array_length(statuses, 1)) + 1],
        project_record.start_date + ((project_record.end_date - project_record.start_date) / milestone_count * (i - 1)),
        project_record.start_date + ((project_record.end_date - project_record.start_date) / milestone_count * i),
        CASE WHEN i <= milestone_count - 2 
             THEN project_record.start_date + ((project_record.end_date - project_record.start_date) / milestone_count * i)
             ELSE NULL END,
        i,
        random_date('2024-01-01'::DATE, '2024-03-01'::DATE),
        NOW()
      );
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- 6. PROJECT UPDATES (800+ progress reports)
-- =====================================================
DO $$
DECLARE
  i INT;
  project_ids UUID[];
  contractor_user_ids UUID[];
  inspector_user_ids UUID[];
  project_id UUID;
  submitted_by UUID;
  approved_by UUID;
  percentage INT;
BEGIN
  SELECT ARRAY_AGG(id) INTO project_ids FROM projects WHERE status IN ('In_Progress', 'Completed');
  SELECT ARRAY_AGG(id) INTO contractor_user_ids FROM users WHERE role = 'Contractor';
  SELECT ARRAY_AGG(id) INTO inspector_user_ids FROM users WHERE role = 'Technical_Inspector';
  
  IF array_length(project_ids, 1) > 0 AND array_length(contractor_user_ids, 1) > 0 THEN
    FOR i IN 1..800 LOOP
      project_id := project_ids[(i % array_length(project_ids, 1)) + 1];
      submitted_by := contractor_user_ids[(i % array_length(contractor_user_ids, 1)) + 1];
      
      IF array_length(inspector_user_ids, 1) > 0 AND i % 3 != 0 THEN
        approved_by := inspector_user_ids[(i % array_length(inspector_user_ids, 1)) + 1];
      ELSE
        approved_by := NULL;
      END IF;
      
      percentage := (RANDOM() * 100)::INT;
      
      INSERT INTO project_updates (
        project_id, submitted_by, percentage_complete,
        report_text, is_approved, is_pending_approval,
        approved_by, approval_comments,
        submitted_at, approved_at
      ) VALUES (
        project_id,
        submitted_by,
        percentage,
        'Progress report #' || i || ': Work is progressing as scheduled. ' ||
        'Current completion status is at ' || percentage || '%. ' ||
        'Key activities completed include site preparation, material procurement, and construction work. ' ||
        'No major issues encountered. Expected to meet deadline.',
        (approved_by IS NOT NULL),
        (approved_by IS NULL),
        approved_by,
        CASE WHEN approved_by IS NOT NULL 
             THEN 'Approved. Progress is satisfactory and meets quality standards.'
             ELSE NULL END,
        random_date('2024-03-01'::DATE, '2024-11-15'::DATE),
        CASE WHEN approved_by IS NOT NULL 
             THEN random_date('2024-03-15'::DATE, '2024-11-30'::DATE)
             ELSE NOW() END
      );
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 7. PROJECT DOCUMENTS (1000+ documents)
-- =====================================================
DO $$
DECLARE
  i INT;
  project_ids UUID[];
  user_ids UUID[];
  project_id UUID;
  uploader_id UUID;
  doc_types TEXT[] := ARRAY[
    'Proposal', 'Budget', 'Engineering Plans', 'Environmental Impact',
    'Permits', 'Contract', 'Progress Photos', 'Inspection Report',
    'Change Order', 'Completion Certificate'
  ];
BEGIN
  SELECT ARRAY_AGG(id) INTO project_ids FROM projects;
  SELECT ARRAY_AGG(id) INTO user_ids FROM users;
  
  IF array_length(project_ids, 1) > 0 AND array_length(user_ids, 1) > 0 THEN
    FOR i IN 1..1000 LOOP
      project_id := project_ids[(i % array_length(project_ids, 1)) + 1];
      uploader_id := user_ids[(i % array_length(user_ids, 1)) + 1];
      
      INSERT INTO project_documents (
        project_id, document_type, file_name, file_url,
        uploaded_by, created_at
      ) VALUES (
        project_id,
        doc_types[(i % array_length(doc_types, 1)) + 1],
        'document_' || i || '_' || LOWER(REPLACE(doc_types[(i % array_length(doc_types, 1)) + 1], ' ', '_')) || '.pdf',
        'https://storage.example.com/projects/' || project_id || '/doc_' || i || '.pdf',
        uploader_id,
        random_date('2023-06-01'::DATE, '2024-11-15'::DATE)
      );
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 8. DONATIONS (150 in-kind donations)
-- =====================================================
DO $$
DECLARE
  i INT;
  project_ids UUID[];
  inspector_ids UUID[];
  project_id UUID;
  logged_by UUID;
  donation_items TEXT[] := ARRAY[
    'Construction Materials', 'Tools and Equipment', 'Labor Services',
    'Heavy Equipment Rental', 'Office Supplies', 'Safety Gear',
    'Electrical Materials', 'Plumbing Materials', 'Paint Supplies'
  ];
  units TEXT[] := ARRAY['bags', 'pieces', 'hours', 'days', 'sets', 'boxes', 'gallons'];
BEGIN
  SELECT ARRAY_AGG(id) INTO project_ids FROM projects WHERE status IN ('In_Progress', 'Completed');
  SELECT ARRAY_AGG(id) INTO inspector_ids FROM users WHERE role IN ('Technical_Inspector', 'System_Administrator');
  
  IF array_length(project_ids, 1) > 0 AND array_length(inspector_ids, 1) > 0 THEN
    FOR i IN 1..150 LOOP
      project_id := project_ids[(i % array_length(project_ids, 1)) + 1];
      logged_by := inspector_ids[(i % array_length(inspector_ids, 1)) + 1];
      
      INSERT INTO donations (
        project_id, donor_name, donation_description,
        quantity, unit, donation_date, logged_by, created_at
      ) VALUES (
        project_id,
        CASE (i % 5)
          WHEN 0 THEN 'Barangay Council'
          WHEN 1 THEN 'Local Business Association'
          WHEN 2 THEN 'Community Organization'
          WHEN 3 THEN 'Private Donor'
          ELSE 'Anonymous Benefactor'
        END,
        donation_items[(i % array_length(donation_items, 1)) + 1],
        (10 + RANDOM() * 500)::INT,
        units[(i % array_length(units, 1)) + 1],
        random_date('2024-01-01'::DATE, '2024-11-15'::DATE),
        logged_by,
        random_date('2024-01-01'::DATE, '2024-11-15'::DATE)
      );
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 9. PROJECT HISTORY (audit logs)
-- =====================================================
DO $$
DECLARE
  project_record RECORD;
  user_ids UUID[];
  changed_by UUID;
  statuses project_status[] := ARRAY['Pending_Review', 'Prioritized', 'Funded', 'Open_For_Bidding', 'In_Progress', 'Completed']::project_status[];
  prev_status project_status;
BEGIN
  SELECT ARRAY_AGG(id) INTO user_ids FROM users WHERE role IN ('System_Administrator', 'Development_Council', 'Budget_Officer', 'BAC_Secretariat');
  
  IF array_length(user_ids, 1) > 0 THEN
    FOR project_record IN SELECT id, status FROM projects LOOP
      prev_status := 'Pending_Review';
      
      FOR i IN 1..array_position(statuses, project_record.status) LOOP
        changed_by := user_ids[(i % array_length(user_ids, 1)) + 1];
        
        INSERT INTO project_history (
          project_id, changed_by, action_type,
          old_status, new_status, change_details, created_at
        ) VALUES (
          project_record.id,
          changed_by,
          'Status Change',
          prev_status,
          statuses[i],
          jsonb_build_object(
            'comment', 'Status updated from ' || prev_status || ' to ' || statuses[i],
            'timestamp', NOW()
          ),
          random_date('2023-06-01'::DATE, '2024-11-01'::DATE)
        );
        
        prev_status := statuses[i];
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 10. UPDATE ATTACHMENTS (for project updates)
-- =====================================================
DO $$
DECLARE
  i INT;
  update_ids UUID[];
  update_id UUID;
  attachment_types TEXT[] := ARRAY['Photo', 'Document', 'Report', 'Drawing', 'Video'];
BEGIN
  SELECT ARRAY_AGG(id) INTO update_ids FROM project_updates;
  
  IF array_length(update_ids, 1) > 0 THEN
    FOR i IN 1..500 LOOP
      update_id := update_ids[(i % array_length(update_ids, 1)) + 1];
      
      INSERT INTO update_attachments (
        update_id, file_name, file_url, attachment_type, uploaded_at
      ) VALUES (
        update_id,
        'attachment_' || i || '_' || LOWER(attachment_types[(i % array_length(attachment_types, 1)) + 1]) || 
        CASE (i % 5)
          WHEN 0 THEN '.jpg'
          WHEN 1 THEN '.pdf'
          WHEN 2 THEN '.docx'
          WHEN 3 THEN '.png'
          ELSE '.mp4'
        END,
        'https://storage.example.com/updates/' || update_id || '/file_' || i || 
        CASE (i % 5)
          WHEN 0 THEN '.jpg'
          WHEN 1 THEN '.pdf'
          WHEN 2 THEN '.docx'
          WHEN 3 THEN '.png'
          ELSE '.mp4'
        END,
        attachment_types[(i % array_length(attachment_types, 1)) + 1],
        random_date('2024-03-01'::DATE, '2024-11-15'::DATE)
      );
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- SUMMARY: Show record counts
-- =====================================================
SELECT 
  'Contractors' as table_name, COUNT(*) as record_count FROM contractors
UNION ALL SELECT 'Projects', COUNT(*) FROM projects
UNION ALL SELECT 'Bid Invitations', COUNT(*) FROM bid_invitations
UNION ALL SELECT 'Bids', COUNT(*) FROM bids
UNION ALL SELECT 'Milestones', COUNT(*) FROM milestones
UNION ALL SELECT 'Project Updates', COUNT(*) FROM project_updates
UNION ALL SELECT 'Project Documents', COUNT(*) FROM project_documents
UNION ALL SELECT 'Donations', COUNT(*) FROM donations
UNION ALL SELECT 'Project History', COUNT(*) FROM project_history
UNION ALL SELECT 'Update Attachments', COUNT(*) FROM update_attachments
ORDER BY table_name;

-- Clean up helper functions
DROP FUNCTION IF EXISTS random_date(DATE, DATE);
DROP FUNCTION IF EXISTS random_phone();
