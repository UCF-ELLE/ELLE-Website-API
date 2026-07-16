# How to Access the ELLE Server

(The sponsor will likely tell you that you have to schedule an appointment with Dr. Brook Miller to get an account to get access into the ELLE server, however, this is not entirely necessary and it is better if you don’t as it ensures that all ELLE related files are posted under one user on the server (the elle user), thus allowing for an easier removal of previous/old files if necessary by future groups)

**(This is written assuming you already have Cisco Secure Connect VPN downloaded and configured for UCF already, if you need help setting up the VPN, you can follow this knowledge base article \- [UCF Cisco VPN Knowledge Base Article](https://ucfsandbox.service-now.com/kb?id=kb_article_view&sysparm_article=KB0010298&sys_kb_id=4839a6f3479b8d903d10c5e3846d4312&spa=1))**

**(This first step is only necessary if you are off campus/not on the UCF-WPA2 WiFi already)** 

1. Open Cisco Secure Client and connect to the UCF VPN as a STUDENT  
   1. [secure.vpn.ucf.edu](http://secure.vpn.ucf.edu)  
   2. Log in with your NID

    

2. Open your terminal and SSH into the ELLE server

   ```
   ssh elle@chdr.cs.ucf.edu
   ```

   password: is the same as the ucf2 user account (it is not listed for privacy and security reasons)


   SSH-ing into the ELLE server as the ELLE user puts you right into the elle folder, and everything regarding the website should be within this user’s folder

And now you are in to the ELLE Server, the following is how to actually do stuff while on the ELLE server and other bits of information you should be wary of

# General Things to Know and Consider Regarding ELLE Server

This is a shared server space that is being used to host more than just the ELLE server, so this does put restrictions on what you can do regarding implementation. It confines implementation to be as simple as possible/as efficient as possible.

So, in regards to any group working with Talking With Tito, it prevents you from being able to use a large language model (LLM). It confines you to using a small language model (SLM) that will be run on the ELLE server. 

# How to Merge Code on to the UCF-ELLE/ELLE-Website-API GitHub

There are several ways to go about this, but this is the methodology that I followed and found best.

1. Start on the UCF-ELLE/ELLE-Website-API GitHub   
      
2. Make a branch on the UCF-ELLE/ELLE-Website-API GitHub   
   1. Click here

   <img width="185" height="52" alt="Screenshot 2026-07-16 at 7 20 09 PM" src="https://github.com/user-attachments/assets/b6d39d46-c653-4593-8d1e-3e754225881a" />


   2. Click here to make a new branch and title it whatever you want

   <img width="180" height="64" alt="Screenshot 2026-07-16 at 7 20 20 PM" src="https://github.com/user-attachments/assets/67058e62-7f69-4633-88d5-93f5a1b14fe0" />
    
3. Go back to the home page of the UCF-ELLE/ELLE-Website-API repo  
     
4. Make a fork of the UCF-ELLE/ELLE-Website-API repo and click the arrow to bring up the dropdown menu and click “*Create a new fork*” and name it whatever you want

   <img width="476" height="233" alt="Screenshot 2026-07-16 at 7 20 30 PM" src="https://github.com/user-attachments/assets/77c884dc-cd00-448b-86e4-3e1636c14032" />


   (This option should be on the right side of the page. This fork will be the repo where you and your team will push code to when testing new features)

   

5. Now, after you have done your code changes to your repo, make a pull request from your repo that forks the UCF-ELLE/ELLE-Website-API repo  
   1. Click on the Pull Requests on the top bar  
   2. Click New Pull Request  
   3. It will originally look like this:

      <img width="564" height="38" alt="Screenshot 2026-07-16 at 7 20 42 PM" src="https://github.com/user-attachments/assets/9bd9104e-0a30-4961-b4ed-b8767c90daf2" />


      At this step, you CAN make the pull request like this and handle any merge conflicts that do come up (should be few to none assuming your group did not touch files that other groups touched, which should not be the case with how Senior Design projects have recently been assigned by game recently). I however still prefer to merge it to a separate branch and handle any merge conflicts on the branch as this upholds the whole idea of “keeping main as the production/live branch”

        
   4. Change the base (or the branch) you are merging to on the UCF-ELLE/ELLE-Website-API to whatever you named your branch

      <img width="565" height="22" alt="Screenshot 2026-07-16 at 7 20 53 PM" src="https://github.com/user-attachments/assets/da525b7a-5d6f-4f79-9761-324ee4a000e2" />

         
   6. Create the pull request by clicking “*Create pull request*”. 

    

6. Merge the pull request  
   1. Now go to the Files Changed tab 

	<img width="174" height="30" alt="Screenshot 2026-07-14 at 11 29 36 PM" src="https://github.com/user-attachments/assets/c09872c6-a595-493c-b00d-1ff3037b70a9" />      

Here, you will be able to see what files will be added to the repo, but more importantly, be able to handle any merge conflicts if any. Going through these merge conflicts will ensure that you are selecting to keep your groups code changes and verifying that they are being implemented correctly, as this part can sometimes be finicky and result in files that don’t compile completely.

# How to Rebuild the ELLE Website After Pushing Code to the UCF-ELLE/ELLE-Website-API GitHub

these steps are written assuming you: 

1. already have your code on the GitHub   
2. are ssh’d into the ELLE server



**(If you are off campus, you must use the Cisco Secure Connect VPN to be on the UCF VPN, this is explained in the *How to Access the ELLE Server*)**

1. Go to the frontend’s directory  
   ```  
   cd ELLE-2024-Website-API/templates  
   ```  
     
2. git pull and rebuild website

	```  
	git pull

	npm install

	npm run build

	pm2 restart LanguageTools 

	pm2 restart Llama-Server

	pm2 restart api-using-venv
	```
(you technically don't have to restart this one, but it should be fine if you do)

	pm2 restart elle_website  
