# F07 — Member ↔ Staff Chat

1. Messages — threads by staff role (coach/dietitian/doctor) if assigned  
2. Open thread → load messages; realtime insert  
3. Send text → insert `chat_messages` sender_type=member  
4. Unread badge on nav; mark read on open  
5. Push (mobile): notify staff/member on new message  

Thread uniqueness: `(member_id, staff_role)`. No assignment → empty state “Uzman atanmadı”.
