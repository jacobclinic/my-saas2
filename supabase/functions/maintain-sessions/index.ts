// @deno-types https://deno.land/x/supabase@1.99.9/mod.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define the Session type
type NewSessionAtClass = {
  class_id: string;
  start_time: string;
  end_time: string;
  created_at: string;
  meeting_url?: string;
  zoom_meeting_id?: string;
};

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
  
class ZoomService {
	private clientId: string;
	private clientSecret: string;
	private accountId: string;
	private baseUrl: string = 'https://api.zoom.us/v2';
	private tokenUrl: string = 'https://zoom.us/oauth/token';
	private accessToken: string | null = null;
	private tokenExpiry: number = 0;

	constructor() {
		this.clientId = Deno.env.get('ZOOM_CLIENT_ID') || '';
		this.clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET') || '';
		this.accountId = Deno.env.get('ZOOM_ACCOUNT_ID') || '';
	}

	private async getAccessToken(): Promise<string | null> {
    try {
        // Check if we have a valid token
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        // Log environment variables (temporarily, for debugging)
        console.log('Checking Zoom credentials:', {
            hasClientId: !!this.clientId,
            hasClientSecret: !!this.clientSecret,
            hasAccountId: !!this.accountId
        });

        if (!this.clientId || !this.clientSecret || !this.accountId) {
            throw new Error('Missing Zoom credentials');
        }

        const authHeader = btoa(`${this.clientId}:${this.clientSecret}`);
        
        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'grant_type': 'account_credentials',
                'account_id': this.accountId
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
                `Zoom API error: ${response.status} ${response.statusText}` +
                (errorData ? ` - ${JSON.stringify(errorData)}` : '')
            );
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        
        return this.accessToken;
    } catch (error) {
        console.error('Detailed Zoom auth error:', error);
        throw error;
    }
	}

	async createMeeting(topic: string, startTime: string, duration: number = 30): Promise<any> {
		const token = await this.getAccessToken();
		
		const response = await fetch(`${this.baseUrl}/users/me/meetings`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				topic,
				type: 2, // Scheduled meeting
				start_time: startTime,
				duration,
				timezone: 'Asia/Colombo',
				settings: {
					host_video: true,
					participant_video: true,
					join_before_host: false,
					mute_upon_entry: true,
					waiting_room: true,
					meeting_authentication: false
				}
			})
		});

		if (!response.ok) {
			throw new Error('Failed to create Zoom meeting');
		}

		return response.json();
	}
}
  
const zoomService = new ZoomService();
  
Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders })
	}

	try {
		const supabaseClient = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false
				}
			}
		)

		// Get all active classes
		const { data: classes, error: classError } = await supabaseClient
			.from('classes')
			.select('id, name, time_slots')
			.eq('status', 'active')

		if (classError) throw classError

		console.log('Found classes:', classes)

		// Process each class
		for (const classRecord of classes) {
			const { data: latestSessions, error: sessionError } = await supabaseClient
				.from('sessions')
				.select('start_time')
				.eq('class_id', classRecord.id)
				.order('start_time', { ascending: false })
				.limit(1)

			if (sessionError) throw sessionError

			console.log('Latest sessions for class', classRecord.id, ':', latestSessions)

			const latestSessionDate = latestSessions?.[0]?.start_time 
				? new Date(latestSessions[0].start_time)
				: new Date()
			
			const fourWeeksFromNow = new Date()
			fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28)

			if (latestSessionDate < fourWeeksFromNow) {
				const newSessions = generateNextSessions(classRecord.id, classRecord.time_slots, latestSessionDate, fourWeeksFromNow)
				
				if (newSessions.length > 0) {
					// Create sessions with Zoom meetings
					for (const session of newSessions) {
						try {
								console.log('Creating Zoom meeting for session:', {
										classId: classRecord.id,
										sessionDate: new Date(session.start_time).toISOString()
								});

								const zoomMeeting = await zoomService.createMeeting(
										`${classRecord.name} - ${new Date(session.start_time).toLocaleDateString()}`,
										session.start_time
								);

								session.meeting_url = zoomMeeting.join_url;
								session.zoom_meeting_id = zoomMeeting.id.toString();
								
								console.log('Successfully created Zoom meeting:', {
										meetingId: zoomMeeting.id,
										joinUrl: zoomMeeting.join_url
								});
						} catch (error: any) {
								console.error('Detailed error creating Zoom meeting:', {
										error: error.message,
										stack: error.stack,
										sessionData: {
												classId: classRecord.id,
												sessionDate: session.start_time
										}
								});
								// Continue with next session even if Zoom creation fails
						}
					}

					const { error: insertError } = await supabaseClient
						.from('sessions')
						.insert(newSessions)

					if (insertError) throw insertError
					console.log(`Created ${newSessions.length} new sessions for class ${classRecord.id}`)
				}
			}
		}

		return new Response(
			JSON.stringify({ 
				success: true, 
				message: 'Sessions maintenance completed' 
			}),
			{ 
				headers: { 
					...corsHeaders,
					'Content-Type': 'application/json'
				} 
			}
		)
	} catch (error) {
		console.error('Error:', error)
		return new Response(
			JSON.stringify({ 
				success: false, 
				error: error.message 
			}),
			{ 
				status: 400,
				headers: { 
					...corsHeaders,
					'Content-Type': 'application/json'
				} 
			}
		)
	}
})
  
function generateNextSessions(classId: string, timeSlots: any[], lastSessionDate: Date, fourWeeksFromNow: Date): NewSessionAtClass[] {
	const newSessions: NewSessionAtClass[] = [];
	const dayMap: { [key: string]: number } = {
		'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
		'thursday': 4, 'friday': 5, 'saturday': 6
	}

	for (const timeSlot of timeSlots) {
		let currentDate = new Date(lastSessionDate)
		const [hours, minutes] = timeSlot.time.split(':').map(Number)
		const targetDay = dayMap[timeSlot.day.toLowerCase()]

		// Generate next 4 sessions for this time slot
		for (let i = 0; i < 4; i++) {
			while (currentDate.getDay() !== targetDay) {
				currentDate.setDate(currentDate.getDate() + 1)
			}

			if (currentDate > fourWeeksFromNow) break

			const sessionDate = new Date(currentDate)
			sessionDate.setHours(hours, minutes, 0, 0)

			const endTime = new Date(sessionDate)
			endTime.setHours(endTime.getHours() + 2)

			newSessions.push({
				class_id: classId,
				start_time: sessionDate.toISOString(),
				end_time: endTime.toISOString(),
				created_at: new Date().toISOString()
			})

			currentDate.setDate(currentDate.getDate() + 7)
		}
	}

	return newSessions
}