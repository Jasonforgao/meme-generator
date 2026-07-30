/**
 * Supabase 后端模块
 * 提供全网共享的全局计数器和展示区功能
 */
const SupabaseBackend = (() => {
  let client = null;
  let isReady = false;

  function init() {
    if (typeof SUPABASE_CONFIG === 'undefined' ||
        !SUPABASE_CONFIG.url || SUPABASE_CONFIG.url.includes('YOUR_PROJECT')) {
      console.warn('Supabase 未配置，展示区将仅使用本地数据');
      return false;
    }
    if (typeof supabase === 'undefined') {
      console.warn('Supabase 客户端库未加载');
      return false;
    }
    try {
      client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      isReady = true;
      return true;
    } catch (e) {
      console.warn('Supabase 初始化失败:', e);
      return false;
    }
  }

  function ready() {
    return isReady;
  }

  // 获取全局计数器值
  async function getCounter() {
    if (!isReady) return null;
    try {
      const { data, error } = await client
        .from('global_counter')
        .select('value')
        .eq('id', 1)
        .single();
      if (error) throw error;
      return data?.value ?? null;
    } catch (e) {
      console.warn('获取计数器失败:', e);
      return null;
    }
  }

  // 原子递增计数器，返回新值
  async function incrementCounter() {
    if (!isReady) return null;
    try {
      const { data, error } = await client.rpc('increment_counter');
      if (error) throw error;
      return data ?? null;
    } catch (e) {
      console.warn('递增计数器失败:', e);
      return null;
    }
  }

  // 获取最近的展示条目
  async function getShowcaseItems(limit = 20) {
    if (!isReady) return [];
    try {
      const { data, error } = await client
        .from('showcase_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('获取展示条目失败:', e);
      return [];
    }
  }

  // 添加展示条目
  async function addShowcaseItem(item) {
    if (!isReady) return null;
    try {
      const { data, error } = await client
        .from('showcase_items')
        .insert({
          thumbnail: item.thumbnail || null,
          caption: item.caption || '',
          style: item.style || '',
          expression: item.expression || ''
        })
        .select()
        .single();
      if (error) throw error;

      // 清理旧条目，只保留最近 50 条
      cleanupOldItems(50);

      return data;
    } catch (e) {
      console.warn('添加展示条目失败:', e);
      return null;
    }
  }

  // 清理旧条目（异步执行，不阻塞）
  async function cleanupOldItems(keepCount) {
    if (!isReady) return;
    try {
      const { data: allItems } = await client
        .from('showcase_items')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(keepCount + 10);

      if (allItems && allItems.length > keepCount) {
        const idsToDelete = allItems.slice(keepCount).map(item => item.id);
        await client
          .from('showcase_items')
          .delete()
          .in('id', idsToDelete);
      }
    } catch (e) {
      // 静默失败，清理不是关键操作
      console.warn('清理旧条目失败:', e);
    }
  }

  return {
    init,
    ready,
    getCounter,
    incrementCounter,
    getShowcaseItems,
    addShowcaseItem
  };
})();
