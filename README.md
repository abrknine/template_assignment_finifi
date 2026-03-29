

THIS README contains ans of all the question asked

1) My approach and parsing flow-- 

  a)i takes pdf file along with caption and with proper validation i
 b)Extract text from PDF using pdfparser(pacakge to prase pdf) then  c)give that data to gemini with custom prompt for each type of pdf (that prompt is designed analysing the schema of my pdf ) 
   to make data structured in clear json format 
  d) then store structured data to mongodb 
  e) and run  matching algo 
  f) one each uplaod i run that matching algo and update my matches table


2) assumption 
 a) all pdfs have same formats
 b) all must contain common number for po,grn and invoice 
 


