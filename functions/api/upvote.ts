/**
 * Handle requests to the upvote API
 * GET: Return the current upvote count for a slug
 * POST: Increment the upvote count for a slug
 */
export const onRequest = async (context: {
  request: Request
  env: Env
}): Promise<Response> => {
  // Add CORS headers to allow requests from any origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle OPTIONS request for CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  const { request, env } = context
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')

  // Validate slug parameter
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug parameter' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Handle different HTTP methods
  try {
    if (request.method === 'GET') {
      return await handleGetUpvotes(slug, env, corsHeaders)
    } else if (request.method === 'POST') {
      return await handlePostUpvotes(slug, env, corsHeaders)
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      })
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

/**
 * Handle GET requests to retrieve upvote count
 */
async function handleGetUpvotes(
  slug: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const upvotes = (await env.powwarm_upvote.get(getUpvoteKey(slug))) || '0'

  return new Response(
    JSON.stringify({ slug, upvotes: parseInt(upvotes, 10) }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

/**
 * Handle POST requests to increment upvote count
 */
async function handlePostUpvotes(
  slug: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const currentUpvotes = parseInt(
    (await env.powwarm_upvote.get(getUpvoteKey(slug))) || '0',
    10
  )
  const newUpvotes = currentUpvotes + 1

  await env.powwarm_upvote.put(getUpvoteKey(slug), newUpvotes.toString())

  return new Response(JSON.stringify({ slug, upvotes: newUpvotes }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

/**
 * Helper function to generate a consistent KV key for upvotes
 */
function getUpvoteKey(slug: string): string {
  return `upvotes:${slug}`
}
