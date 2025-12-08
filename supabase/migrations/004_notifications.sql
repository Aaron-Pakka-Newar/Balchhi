-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('claim_received', 'claim_approved', 'claim_rejected', 'new_message', 'item_matched', 'item_expired')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications  
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (via service role or triggers)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Function to create notification when a claim is made
CREATE OR REPLACE FUNCTION notify_on_claim()
RETURNS TRIGGER AS $$
DECLARE
  item_title TEXT;
  item_owner_id UUID;
BEGIN
  -- Get item details
  SELECT title, user_id INTO item_title, item_owner_id
  FROM items WHERE id = NEW.item_id;
  
  -- Create notification for item owner
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    item_owner_id,
    'claim_received',
    'New Claim Received',
    'Someone has claimed your item: ' || item_title,
    jsonb_build_object('claim_id', NEW.id, 'item_id', NEW.item_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_claim ON claims;
CREATE TRIGGER trigger_notify_on_claim
  AFTER INSERT ON claims
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_claim();

-- Function to notify claimant when claim status changes
CREATE OR REPLACE FUNCTION notify_on_claim_status_change()
RETURNS TRIGGER AS $$
DECLARE
  item_title TEXT;
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only trigger if status changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get item title
  SELECT title INTO item_title FROM items WHERE id = NEW.item_id;
  
  IF NEW.status = 'approved' THEN
    notification_type := 'claim_approved';
    notification_title := 'Claim Approved!';
    notification_message := 'Your claim for "' || item_title || '" has been approved!';
  ELSIF NEW.status = 'rejected' THEN
    notification_type := 'claim_rejected';
    notification_title := 'Claim Rejected';
    notification_message := 'Your claim for "' || item_title || '" was not approved.';
  ELSE
    RETURN NEW;
  END IF;
  
  -- Create notification for claimant
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.claimant_id,
    notification_type,
    notification_title,
    notification_message,
    jsonb_build_object('claim_id', NEW.id, 'item_id', NEW.item_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_claim_status ON claims;
CREATE TRIGGER trigger_notify_on_claim_status
  AFTER UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_claim_status_change();

-- Function to notify on new message
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  conv RECORD;
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get conversation details
  SELECT * INTO conv FROM conversations WHERE id = NEW.conversation_id;
  
  -- Determine recipient (the other participant)
  IF conv.participant_1 = NEW.sender_id THEN
    recipient_id := conv.participant_2;
  ELSE
    recipient_id := conv.participant_1;
  END IF;
  
  -- Get sender name
  SELECT name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    recipient_id,
    'new_message',
    'New Message from ' || sender_name,
    LEFT(NEW.content, 100),
    jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_message ON conversation_messages;
CREATE TRIGGER trigger_notify_on_message
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();
