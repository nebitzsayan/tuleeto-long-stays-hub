import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName, fileData, folder } = await req.json()
    
    if (!fileName || !fileData) {
      return new Response(
        JSON.stringify({ error: 'Missing fileName or fileData' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const IMAGEKIT_PRIVATE_KEY = Deno.env.get('IMAGEKIT_PRIVATE_KEY')
    const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/onxfnatli'
    const IMAGEKIT_PUBLIC_KEY = 'public_sbDEA49Rrc/AOtmnG8idOIiyM5E='

    if (!IMAGEKIT_PRIVATE_KEY) {
      console.error('ImageKit private key not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'ImageKit configuration missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create form data for ImageKit upload
    const formData = new FormData()
    
    // Convert base64 to blob
    const base64Data = fileData.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray])
    
    formData.append('file', blob, fileName)
    formData.append('fileName', fileName)
    if (folder) {
      formData.append('folder', folder)
    }
    formData.append('useUniqueFileName', 'true')

    // Create authentication header
    const auth = btoa(`${IMAGEKIT_PRIVATE_KEY}:`)
    
    console.log('Uploading to ImageKit...')
    
    // Upload to ImageKit
    const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    })

    const result = await uploadResponse.json()
    
    if (!uploadResponse.ok) {
      console.error('ImageKit upload failed:', result)
      return new Response(
        JSON.stringify({ error: 'Upload failed', details: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Successfully uploaded to ImageKit:', result.url)
    
    return new Response(
      JSON.stringify({ 
        url: result.url,
        fileId: result.fileId,
        name: result.name,
        size: result.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in upload-to-imagekit function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})