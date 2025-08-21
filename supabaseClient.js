// Shared Supabase client for all pages
// Ensure @supabase/supabase-js is loaded via CDN before this script

(function () {
	var SUPABASE_URL = 'https://ucrghvoeejswrmgmyoat.supabase.co';
	var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcmdodm9lZWpzd3JtZ215b2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzAwNzEsImV4cCI6MjA2ODcwNjA3MX0.vFtRrtAOcs9xp5mr8FLFAS-oqnSyhPyfBSYVZaz9zJI';

	if (typeof window === 'undefined' || typeof supabase === 'undefined') {
		console.error('Supabase JS CDN must be loaded before supabaseClient.js');
		return;
	}

	window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();

