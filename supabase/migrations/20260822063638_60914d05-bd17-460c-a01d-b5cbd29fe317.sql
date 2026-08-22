INSERT INTO public.shops (id, owner_id, name, tagline, city, address, phone) VALUES
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000d1','Ember & Blade','Sharp fades, hot towels, no small talk required','Mumbai','12 Fort Street, Colaba','+91 98200 11223'),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000d2','Steel Room Barbers','Precision grooming for the modern gentleman','Bengaluru','44 Indiranagar 100ft Road','+91 98450 44556'),
 ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-0000000000d3','Iron Comb Co.','Classic cuts with a straight-razor finish','Delhi','7 Hauz Khas Village','+91 98110 77889');

INSERT INTO public.services (shop_id, name, description, category, duration_min, price_cents) VALUES
 ('11111111-1111-1111-1111-111111111111','Signature Skin Fade','Tapered fade blended by hand with a razor edge-up.','hair',45,60000),
 ('11111111-1111-1111-1111-111111111111','Crop Textured Cut','Scissor-cut top with texture and a tight back.','hair',40,55000),
 ('11111111-1111-1111-1111-111111111111','Hot Towel Beard Sculpt','Shaped, lined and oiled with a hot towel finish.','beard',30,40000),
 ('11111111-1111-1111-1111-111111111111','Charcoal Face Detox','Deep-clean facial for shave-irritated skin.','grooming',40,70000),
 ('22222222-2222-2222-2222-222222222222','Executive Scissor Cut','Understated, office-ready and easy to restyle.','hair',40,65000),
 ('22222222-2222-2222-2222-222222222222','Buzz & Line-Up','Single-length clipper cut with crisp lines.','hair',25,30000),
 ('22222222-2222-2222-2222-222222222222','Straight Razor Shave','Full traditional wet shave, two-pass.','beard',35,50000),
 ('22222222-2222-2222-2222-222222222222','Grey Blending','Subtle colour to soften greys, never flat black.','grooming',50,90000),
 ('33333333-3333-3333-3333-333333333333','Pompadour Restyle','High-volume classic with a matte finish.','hair',50,75000),
 ('33333333-3333-3333-3333-333333333333','Kids Cut (under 12)','Quick, calm and cartoon-friendly.','hair',25,25000),
 ('33333333-3333-3333-3333-333333333333','Beard Trim & Oil','Weekly upkeep trim with beard oil massage.','beard',20,25000),
 ('33333333-3333-3333-3333-333333333333','Head Massage & Wash','Ten-minute champi with a cool rinse.','grooming',20,20000);
