import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3';
const cfg = window.CASPIAN_CONFIG || {};
const ready = Boolean(cfg.supabaseUrl && cfg.supabasePublishableKey);
const supabase = ready ? createClient(cfg.supabaseUrl, cfg.supabasePublishableKey) : null;
const $ = (id) => document.getElementById(id);
const say = (id, message, kind='') => { const el=$(id); if(el){el.textContent=message;el.className='status '+kind;} };
const esc = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (value) => value ? new Date(value).toLocaleString('fa-IR') : '—';
async function currentUser(){ if(!supabase) return null; const {data:{user}}=await supabase.auth.getUser(); return user; }
async function updateTicketView(){
  const user=await currentUser(); const panel=$('ticket-panel'), mine=$('my-tickets'), out=$('sign-out');
  if(panel) panel.classList.toggle('hidden',!user); if(mine) mine.classList.toggle('hidden',!user); if(out) out.classList.toggle('hidden',!user);
  if($('auth-status')) say('auth-status',user?'وارد شدی: '+user.email:'برای ثبت و مشاهده تیکت ابتدا وارد حساب شو.',user?'success':'');
  if(user && $('ticket-list')){
    const {data,error}=await supabase.from('tickets').select('id,subject,category,status,created_at').order('created_at',{ascending:false});
    if(error){$('ticket-list').textContent='خطا در دریافت تیکت‌ها: '+error.message;return;}
    $('ticket-list').innerHTML=data.length?'<div class="table-wrap"><table><thead><tr><th>موضوع</th><th>دسته</th><th>وضعیت</th><th>تاریخ</th></tr></thead><tbody>'+data.map(t=>'<tr><td>'+esc(t.subject)+'</td><td>'+esc(t.category)+'</td><td>'+esc(t.status)+'</td><td>'+fmt(t.created_at)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">هنوز تیکتی ثبت نکرده‌ای.</div>';
  }
}
async function authAction(mode){
  if(!supabase){say('auth-status','اتصال دیتابیس تنظیم نشده است. فایل assets/js/config.js باید با URL و کلید عمومی پروژه پر شود.','error');return;}
  const email=$('email')?.value.trim(),password=$('password')?.value;
  if(!email||!password){say('auth-status','ایمیل و رمز عبور را وارد کن.','error');return;}
  const result=mode==='signup'?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
  if(result.error){say('auth-status',result.error.message,'error');return;}
  say('auth-status',mode==='signup'?'حساب ساخته شد. اگر تأیید ایمیل فعال است، ایمیلت را بررسی کن.':'ورود موفق بود.','success');await updateTicketView();
}
$('sign-in')?.addEventListener('click',()=>authAction('signin'));
$('sign-up')?.addEventListener('click',()=>authAction('signup'));
$('sign-out')?.addEventListener('click',async()=>{await supabase?.auth.signOut();await updateTicketView();});
$('create-ticket')?.addEventListener('click',async()=>{
  if(!supabase){say('ticket-status','اتصال دیتابیس هنوز تنظیم نشده است.','error');return;}
  const user=await currentUser(),subject=$('subject').value.trim(),message=$('message').value.trim(),category=$('category').value;
  if(!user){say('ticket-status','ابتدا وارد حساب شو.','error');return;}
  if(subject.length<4||message.length<10){say('ticket-status','موضوع و شرح درخواست را کامل‌تر بنویس.','error');return;}
  const {error}=await supabase.from('tickets').insert({user_id:user.id,subject,message,category});
  if(error){say('ticket-status','ثبت تیکت ناموفق بود: '+error.message,'error');return;}
  $('subject').value='';$('message').value='';say('ticket-status','تیکت با موفقیت ثبت شد.','success');await updateTicketView();
});
async function loadStaff(){
  const root=$('staff-list');if(!root)return;
  if(!supabase){root.innerHTML='<div class="empty">برای نمایش فهرست زنده، فایل تنظیمات اتصال دیتابیس تکمیل نشده است.</div>';return;}
  const {data,error}=await supabase.from('staff_profiles').select('display_name,role_label,department,bio,avatar_url,sort_order').eq('is_public',true).order('sort_order');
  if(error){root.innerHTML='<div class="empty">دریافت فهرست ممکن نشد: '+esc(error.message)+'</div>';return;}
  root.innerHTML=data.length?data.map(p=>'<article class="info-card">'+(p.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:50%">':'')+'<span class="tag">'+esc(p.department||'CASPIAN TEAM')+'</span><h3>'+esc(p.display_name)+'</h3><span class="role-pill">'+esc(p.role_label)+'</span><p>'+esc(p.bio||'عضو تیم کاسپین')+'</p></article>').join(''):'<div class="empty">هنوز اعضایی برای نمایش ثبت نشده‌اند.</div>';
}
async function initAdmin(){
  if(!$('admin-sign-in'))return;
  $('admin-sign-in').addEventListener('click',async()=>{
    if(!supabase){say('admin-status','تنظیمات Supabase تکمیل نشده است.','error');return;}
    const email=$('admin-email').value.trim(),password=$('admin-password').value;
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){say('admin-status',error.message,'error');return;}
    const {data:roles,error:roleError}=await supabase.from('user_roles').select('role').eq('user_id',(await currentUser()).id);
    if(roleError||!roles?.length){await supabase.auth.signOut();say('admin-status','این حساب هیچ دسترسی مدیریتی ثبت‌شده‌ای ندارد.','error');return;}
    const allowed=roles.some(x=>['owner','founder','supervisor','admin','moderator','support'].includes(x.role));
    if(!allowed){await supabase.auth.signOut();say('admin-status','سطح دسترسی برای ورود به پنل کافی نیست.','error');return;}
    $('admin-login').classList.add('hidden');$('admin-dashboard').classList.remove('hidden');say('admin-status','دسترسی تأیید شد.','success');await loadAdmin();
  });
}
async function loadAdmin(){
  const body=$('admin-tickets');if(!body)return;
  const {data,error}=await supabase.from('tickets').select('id,subject,category,status,created_at').order('created_at',{ascending:false}).limit(100);
  if(error){body.innerHTML='<tr><td colspan="6">'+esc(error.message)+'</td></tr>';return;}
  body.innerHTML=data.length?data.map(t=>'<tr><td>'+esc(t.id.slice(0,8))+'</td><td>'+esc(t.subject)+'</td><td>'+esc(t.category)+'</td><td>'+esc(t.status)+'</td><td>'+fmt(t.created_at)+'</td><td><select data-ticket="'+esc(t.id)+'" aria-label="وضعیت تیکت"><option value="open" '+(t.status==='open'?'selected':'')+'>باز</option><option value="in_progress" '+(t.status==='in_progress'?'selected':'')+'>در حال بررسی</option><option value="answered" '+(t.status==='answered'?'selected':'')+'>پاسخ داده شد</option><option value="closed" '+(t.status==='closed'?'selected':'')+'>بسته</option></select></td></tr>').join(''):'<tr><td colspan="6">تیکتی وجود ندارد.</td></tr>';
  body.querySelectorAll('select[data-ticket]').forEach(s=>s.addEventListener('change',async()=>{const {error}=await supabase.from('tickets').update({status:s.value}).eq('id',s.dataset.ticket);say('admin-status',error?'ذخیره وضعیت ناموفق بود: '+error.message:'وضعیت تیکت به‌روزرسانی شد.',error?'error':'success');}));
  const {data:setting}=await supabase.from('site_settings').select('value').eq('key','donation_url').maybeSingle();if(setting?.value)$('donation-url').value=setting.value;
  await loadAdminStaff();
}
async function loadAdminStaff(){
  const body=$('staff-admin-list');if(!body)return;
  const {data,error}=await supabase.from('staff_profiles').select('id,display_name,role_label,department,is_public').order('sort_order');
  if(error){body.innerHTML='<tr><td colspan="5">'+esc(error.message)+'</td></tr>';return;}
  body.innerHTML=data.length?data.map(p=>'<tr><td>'+esc(p.display_name)+'</td><td>'+esc(p.role_label)+'</td><td>'+esc(p.department||'—')+'</td><td>'+(p.is_public?'نمایش عمومی':'مخفی')+'</td><td><button data-remove-staff="'+esc(p.id)+'">حذف</button></td></tr>').join(''):'<tr><td colspan="5">عضوی ثبت نشده است.</td></tr>';
  body.querySelectorAll('[data-remove-staff]').forEach(button=>button.addEventListener('click',async()=>{
    if(!confirm('این عضو از فهرست عمومی حذف شود؟'))return;
    const {error}=await supabase.from('staff_profiles').delete().eq('id',button.dataset.removeStaff);
    say('staff-status',error?'حذف ناموفق بود: '+error.message:'عضو حذف شد.',error?'error':'success');
    await loadAdminStaff();
  }));
}
$('add-staff')?.addEventListener('click',async()=>{
  if(!supabase){say('staff-status','اتصال دیتابیس تنظیم نشده است.','error');return;}
  const display_name=$('staff-name').value.trim(),role_label=$('staff-role').value,department=$('staff-department').value.trim(),avatar_url=$('staff-avatar').value.trim(),bio=$('staff-bio').value.trim(),sort_order=Number($('staff-order').value||10);
  if(display_name.length<2){say('staff-status','نام نمایشی را وارد کن.','error');return;}
  if(avatar_url && !/^https:\/\//i.test(avatar_url)){say('staff-status','لینک تصویر باید با https:// شروع شود.','error');return;}
  const {error}=await supabase.from('staff_profiles').insert({display_name,role_label,department,avatar_url:avatar_url||null,bio,sort_order,is_public:true});
  say('staff-status',error?'ثبت عضو ناموفق بود: '+error.message:'عضو تیم با موفقیت ثبت شد.',error?'error':'success');
  if(!error){$('staff-name').value='';$('staff-department').value='';$('staff-avatar').value='';$('staff-bio').value='';await loadAdminStaff();}
}
$('save-donation')?.addEventListener('click',async()=>{
  const url=$('donation-url').value.trim();
  if(!/^https:\/\//i.test(url)){say('settings-status','لینک باید با https:// شروع شود.','error');return;}
  const {error}=await supabase.from('site_settings').upsert({key:'donation_url',value:url,updated_at:new Date().toISOString()});
  say('settings-status',error?'ذخیره نشد: '+error.message:'لینک حمایت ذخیره شد.',''+(error?'error':'success'));
});
function initDonation(){
  const btn=$('donate-button'),status=$('donation-status');if(!btn)return;
  if(cfg.donationUrl){btn.href=cfg.donationUrl;btn.classList.remove('hidden');if(status)status.textContent='درگاه رسمی پیکربندی شده است.';}
  else if(supabase){supabase.from('site_settings').select('value').eq('key','donation_url').maybeSingle().then(({data})=>{if(data?.value){btn.href=data.value;btn.classList.remove('hidden');if(status)status.textContent='درگاه رسمی فعال است.';}});}
}
if($('ticket-panel')){if(!ready)say('auth-status','برای فعال‌سازی ورود و تیکت، URL و کلید عمومی Supabase را در assets/js/config.js وارد کن.','error');else updateTicketView();}
loadStaff();initAdmin();initDonation();
