

THIS README contains ans of all the question asked

1) My approach and parsing flow-- 

  a)i takes pdf file along with caption and with proper validation 

 b)Extract text from PDF using pdfparser(pacakge to prase pdf) then

   c)give that data to gemini with custom prompt for each type of pdf (that prompt is designed analysing the schema of my pdf ) 
   to make data structured in clear json format 

  d) then store structured data to mongodb 

  e) and run  matching algo 

  f) one each uplaod i run that matching algo and update my matches table


2) assumption 

 a) all pdfs have same formats

 b) all must contain common number for po,grn and invoice 


3) Out-of-Order Upload Handling

 a) match.model.js stores documents.po.exists, documents.grn.exists, documents.invoice.exists to know which docs arrived

 b)atch.model.js stores documents.po.exists, documents.grn.exists, documents.invoice.exists to know which docs arrived

  c) match.model.js has updateHistory[] recording what changed and when, creating audit trail of upload order

 4) IF I HAD MORE TIME 

 a) Implement async worker queue (Bull/Redis) for matching logic instead of doing it in API call itself
    - Currently upload takes 50 seconds because Gemini API call blocks the response
    - Split into 2 API calls: POST /upload returns immediately (2 sec), background worker processes matching
 
 b) Upload endpoint returns instantly with status "processing" instead of waiting for matching
    - Client polls GET /api/match/:poNumber to check final status
    - Better UX - no 50 second wait, user gets immediate feedback
    or i can use SSE TO SEND DATA INSTEAD OF POLLING
 
 c) Multiple workers can process matching jobs in parallel from queue
    - Scales horizontally - can handle multiple uploads simultaneously
    - If one upload fails, others continue processing


    I CAN MUTATE OR FIT THIS CODE IN EXIXTING STRUCTURE TO MAKE THINGS SCALABLE AND REALAIBLE IF I  HAD TIME NAD OPPORTUNITY



Postman Collection _https://app.getpostman.com/join-team?invite_code=5480f751db5f26b8d5e91636d0ab20784f8370f3494b472c0ff194e5c4ec2409&target_code=cb660cf5a0037a08fdf3b324e3e6e275

 can only be accesable to chiradeep@finifi.io / arjun@finifi.io


 screenshots--








