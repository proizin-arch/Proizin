-- Cloudflare Workers Free CPU butcesine uygun, sunucu gizli anahtariyla
-- guclendirilmis PBKDF2 hashleri. Parolalar degismez.
UPDATE users
SET password_hash = 'pbkdf2-sha256p$25000$zfnkWud5EzhwjkoaK56agg$IvhDVPkWsW7zhm5rr4MQqaQgYy2Vz2RET7Ce78b3q_c'
WHERE email = 'admin@izinpro.com';

UPDATE users
SET password_hash = 'pbkdf2-sha256p$25000$OENR5Qkx1zlvrOMsMovxwA$4dDgfpdOwPsAEAWG-FbyKrF7HjD51t8Cgv9RJVPsScM'
WHERE email = 'ali.alaya@izinpro.com';

UPDATE users
SET password_hash = 'pbkdf2-sha256p$25000$n4La8SKEXg4XbNuoXrX-9w$3SLuvs74gw4aIm2lQxw5rHFkK_pSsY0rv3eQ--mhKr8'
WHERE email = 'muhammet.ala@izinpro.com';
