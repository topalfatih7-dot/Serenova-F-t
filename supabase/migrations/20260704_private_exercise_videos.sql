-- exercise-videos bucket'ini private yap: gercek dosya URL'i artik disariya
-- sizmiyor, oynatma anlik imzali (signed) URL uzerinden yapiliyor
-- (bkz. api/exercise-video-url.js). RLS politikalari degismiyor; sadece
-- bucket "public" bayragi kapatiliyor, boylece dogrudan public URL ile
-- erisim calismiyor ve gecerli tek yol signed URL oluyor.

update storage.buckets set public = false where id = 'exercise-videos';
