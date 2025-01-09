require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://tjsqhhtjbpmswapalqsl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc3FoaHRqYnBtc3dhcGFscXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5NDM0ODcsImV4cCI6MjA0NjUxOTQ4N30.PZIIkKV_CoupcJJdkDQsDb5A-L_BVCvBbZZ7KUjAkOg"
);

async function testMaintainSessions() {
  try {
    const { data, error } = await supabase.functions.invoke('maintain-sessions', {
      body: {
        testMode: true
      }
    });
    
    console.log('Function response:', data);
    if (error) {
      console.error('Function error:', error);
      return;
    }
    
    // Check if new sessions were created
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }
    console.log('Latest sessions:', sessions);
  } catch (error) {
    console.error('Error:', error);
  }
}

testMaintainSessions();