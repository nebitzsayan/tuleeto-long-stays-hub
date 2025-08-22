
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
      console.error('Missing required fields:', { hasFileName: !!fileName, hasFileData: !!fileData })
      return new Response(
        JSON.stringify({ error: 'Missing fileName or fileData' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get ImageKit credentials from environment variables
    const IMAGEKIT_PRIVATE_KEY = Deno.env.get('IMAGEKIT_PRIVATE_KEY')
    const IMAGEKIT_URL_ENDPOINT = Deno.env.get('IMAGEKIT_URL_ENDPOINT') || 'https://ik.imagekit.io/onxfnatli'
    const IMAGEKIT_PUBLIC_KEY = Deno.env.get('IMAGEKIT_PUBLIC_KEY') || 'public_sbDEA49Rrc/AOtmnG8idOIiyM5E='

    if (!IMAGEKIT_PRIVATE_KEY) {
      console.error('IMAGEKIT_PRIVATE_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ error: 'ImageKit configuration error - missing private key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('ImageKit upload started:', {
      fileName,
      fileSize: fileData.length,
      folder: folder || 'property-images',
      endpoint: IMAGEKIT_URL_ENDPOINT
    })

    // Validate and process file data
    if (!fileData.includes('data:')) {
      console.error('Invalid file data format - missing data URL prefix')
      return new Response(
        JSON.stringify({ error: 'Invalid file format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create form data for ImageKit upload
    const formData = new FormData()
    
    try {
      // Convert base64 to blob with better error handling
      const base64Data = fileData.split(',')[1]
      if (!base64Data) {
        throw new Error('Invalid base64 data')
      }

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
      
      console.log('Form data prepared, blob size:', blob.size)
    } catch (error) {
      console.error('Error processing file data:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to process image data', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create authentication header
    const auth = btoa(`${IMAGEKIT_PRIVATE_KEY}:`)
    
    console.log('Uploading to ImageKit API...')
    
    // Upload to ImageKit with timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
    
    try {
      const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('ImageKit API error:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          body: errorText
        })
        
        return new Response(
          JSON.stringify({ 
            error: 'ImageKit upload failed', 
            details: `HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`,
            body: errorText
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: uploadResponse.status }
        )
      }

      const result = await uploadResponse.json()
      
      if (!result || !result.url) {
        console.error('ImageKit returned invalid response:', result)
        return new Response(
          JSON.stringify({ error: 'Invalid response from ImageKit', details: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      console.log('ImageKit upload successful:', {
        url: result.url,
        fileId: result.fileId,
        size: result.size
      })
      
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
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        console.error('ImageKit upload timeout')
        return new Response(
          JSON.stringify({ error: 'Upload timeout - please try again', details: 'Request timed out after 60 seconds' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 408 }
        )
      }
      
      throw error
    }

  } catch (error) {
    console.error('Error in upload-to-imagekit function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
