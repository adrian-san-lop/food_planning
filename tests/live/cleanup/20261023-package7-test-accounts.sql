-- Only the 2 accounts created by this test run. Review and execute as project owner.
begin;
delete from auth.users u
where u.id in ('c2a91d05-99d1-498e-a454-086512a5780c'::uuid,'675a701f-5330-4eee-9c66-3004f8f256bb'::uuid)
  and u.email like 'menuki.qa.20261023123443-4eeffe.%@example.com'
  and u.raw_user_meta_data ->> 'menuki_test_run' = '20261023123443-4eeffe'
  and not exists (select 1 from public.menuki_admins a where a.user_id = u.id);
commit;
