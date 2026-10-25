<template>
  <div class="role-sidebar-shell">
    <div v-if="open" class="role-sidebar-overlay" aria-hidden="true" @click="$emit('close')"></div>
    <aside
      :id="id"
      class="role-sidebar"
      :class="{ collapsed, open }"
      :aria-label="label"
    >
      <nav :aria-label="label">
        <section v-for="group in groups" :key="group.label" class="role-sidebar-group">
          <h2>{{ group.label }}</h2>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="role-sidebar-link"
            active-class="active"
            :title="collapsed ? item.label : undefined"
            :aria-label="item.label"
            @click="$emit('close')"
          >
            <i :class="item.icon" aria-hidden="true"></i>
            <span>{{ item.label }}</span>
          </RouterLink>
        </section>
      </nav>
      <div v-if="$slots.footer" class="role-sidebar-footer"><slot name="footer" /></div>
    </aside>
  </div>
</template>

<script setup>
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  groups: { type: Array, required: true },
  collapsed: { type: Boolean, default: false },
  open: { type: Boolean, default: false },
});

defineEmits(["close"]);
</script>

<style scoped>
.role-sidebar-shell { display: contents; }
.role-sidebar { position: sticky; top: 64px; align-self: flex-start; display: flex; flex: 0 0 250px; flex-direction: column; width: 250px; min-width: 250px; height: calc(100vh - 64px); overflow: hidden; background: #fff; border-right: 1px solid #e5e7eb; color: #374151; transition: width .2s ease, flex-basis .2s ease, min-width .2s ease; z-index: 20; }
.role-sidebar nav { min-height: 0; flex: 1; overflow-y: auto; padding: 10px 8px; scrollbar-width: thin; }
.role-sidebar-group + .role-sidebar-group { margin-top: 12px; padding-top: 9px; border-top: 1px solid #e5e7eb; }
.role-sidebar-group h2 { margin: 0; padding: 7px 10px 5px; color: #6b7280; font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
.role-sidebar-link { display: flex; align-items: center; gap: 11px; min-height: 40px; margin: 2px 0; padding: 8px 11px; border-radius: 9px; color: #4b5563; font-size: .9rem; text-decoration: none; transition: color .15s ease, background .15s ease; }
.role-sidebar-link i { display: grid; place-items: center; flex: 0 0 20px; width: 20px; font-size: 1rem; }
.role-sidebar-link:hover { background: #fef2f2; color: #991b1b; }
.role-sidebar-link.active { background: #fee2e2; color: #991b1b; font-weight: 700; }
.role-sidebar-link:focus-visible { outline: 2px solid #cd322c; outline-offset: 2px; }
.role-sidebar-footer { flex: 0 0 auto; padding: 10px; border-top: 1px solid #e5e7eb; }
.role-sidebar-footer :deep(.role-sidebar-help) { display: flex; align-items: center; gap: 10px; color: #374151; font-size: .8rem; }
.role-sidebar-footer :deep(.role-sidebar-help i) { flex: 0 0 26px; color: #b42318; text-align: center; }
.role-sidebar-footer :deep(.role-sidebar-help span) { display: grid; gap: 2px; }
.role-sidebar-footer :deep(.role-sidebar-help small) { color: #6b7280; font-size: .7rem; }
.role-sidebar.collapsed { flex-basis: 72px; width: 72px; min-width: 72px; }
.role-sidebar.collapsed .role-sidebar-group h2 { font-size: 0; padding: 5px; text-align: center; }
.role-sidebar.collapsed .role-sidebar-link { justify-content: center; padding: 8px 4px; }
.role-sidebar.collapsed .role-sidebar-link span { display: none; }
.role-sidebar.collapsed .role-sidebar-footer { padding: 8px 4px; }
.role-sidebar-overlay { display: none; }
@media (max-width: 900px) {
  .role-sidebar { position: fixed; top: 64px; bottom: 0; left: 0; z-index: 1002; height: auto; width: 250px; min-width: 250px; transform: translateX(-102%); transition: transform .22s ease; box-shadow: 4px 0 24px #11182724; }
  .role-sidebar.open { transform: translateX(0); }
  .role-sidebar.collapsed { width: 250px; min-width: 250px; flex-basis: 250px; }
  .role-sidebar.collapsed .role-sidebar-group h2 { font-size: .68rem; padding: 7px 10px 5px; text-align: left; }
  .role-sidebar.collapsed .role-sidebar-link { justify-content: flex-start; padding: 8px 11px; }
  .role-sidebar.collapsed .role-sidebar-link span { display: inline; }
  .role-sidebar-overlay { display: block; position: fixed; inset: 64px 0 0; z-index: 1001; background: #11182766; }
}
@media (prefers-reduced-motion: reduce) { .role-sidebar, .role-sidebar-link { transition: none; } }
</style>
