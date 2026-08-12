revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.is_approved(uuid) from anon;
revoke execute on function public.is_moderator(uuid) from anon;
revoke execute on function public.can_edit_transmission(uuid) from anon;
revoke execute on function public.ensure_profile(text,text,text) from anon;
revoke execute on function public.touch_updated_at() from anon;
revoke execute on function public.touch_updated_at() from authenticated;