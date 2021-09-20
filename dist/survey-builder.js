'use strict';

function noop() { }
const identity = x => x;
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function null_to_empty(value) {
    return value == null ? '' : value;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
function run_tasks(now) {
    tasks.forEach(task => {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    let task;
    if (tasks.size === 0)
        raf(run_tasks);
    return {
        promise: new Promise(fulfill => {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
            tasks.delete(task);
        }
    };
}
function append(target, node) {
    target.appendChild(node);
}
function get_root_for_style(node) {
    if (!node)
        return document;
    const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
    if (root && root.host) {
        return root;
    }
    return node.ownerDocument;
}
function append_empty_stylesheet(node) {
    const style_element = element('style');
    append_stylesheet(get_root_for_style(node), style_element);
    return style_element;
}
function append_stylesheet(node, style) {
    append(node.head || node, style);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function to_number(value) {
    return value === '' ? null : +value;
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
    select.selectedIndex = -1; // no option should be selected
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
}

const active_docs = new Set();
let active = 0;
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    const doc = get_root_for_style(node);
    active_docs.add(doc);
    const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
    const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
    if (!current_rules[name]) {
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    const previous = (node.style.animation || '').split(', ');
    const next = previous.filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    );
    const deleted = previous.length - next.length;
    if (deleted) {
        node.style.animation = next.join(', ');
        active -= deleted;
        if (!active)
            clear_rules();
    }
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        active_docs.forEach(doc => {
            const stylesheet = doc.__svelte_stylesheet;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            doc.__svelte_rules = {};
        });
        active_docs.clear();
    });
}

function create_animation(node, from, fn, params) {
    if (!from)
        return noop;
    const to = node.getBoundingClientRect();
    if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
        return noop;
    const { delay = 0, duration = 300, easing = identity, 
    // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
    start: start_time = now() + delay, 
    // @ts-ignore todo:
    end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
    let running = true;
    let started = false;
    let name;
    function start() {
        if (css) {
            name = create_rule(node, 0, 1, duration, delay, easing, css);
        }
        if (!delay) {
            started = true;
        }
    }
    function stop() {
        if (css)
            delete_rule(node, name);
        running = false;
    }
    loop(now => {
        if (!started && now >= start_time) {
            started = true;
        }
        if (started && now >= end) {
            tick(1, 0);
            stop();
        }
        if (!running) {
            return false;
        }
        if (started) {
            const p = now - start_time;
            const t = 0 + 1 * easing(p / duration);
            tick(t, 1 - t);
        }
        return true;
    });
    start();
    tick(0, 1);
    return stop;
}
function fix_position(node) {
    const style = getComputedStyle(node);
    if (style.position !== 'absolute' && style.position !== 'fixed') {
        const { width, height } = style;
        const a = node.getBoundingClientRect();
        node.style.position = 'absolute';
        node.style.width = width;
        node.style.height = height;
        add_transform(node, a);
    }
}
function add_transform(node, a) {
    const b = node.getBoundingClientRect();
    if (a.left !== b.left || a.top !== b.top) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    }
}

let current_component;
function set_current_component(component) {
    current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
}
function fix_and_outro_and_destroy_block(block, lookup) {
    block.f();
    outro_and_destroy_block(block, lookup);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(child_ctx, dirty);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : options.context || []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

var SurveyBuilderTypes;
(function (SurveyBuilderTypes) {
    SurveyBuilderTypes["TextInput"] = "input";
    SurveyBuilderTypes["TextValue"] = "text";
    SurveyBuilderTypes["SingleSelect"] = "single";
    SurveyBuilderTypes["MultipleSelect"] = "multiple";
    SurveyBuilderTypes["StarsRating"] = "rating";
})(SurveyBuilderTypes || (SurveyBuilderTypes = {}));

/* src/SurveyBuilder/TypeSelector.svelte generated by Svelte v3.42.4 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i][0];
	child_ctx[7] = list[i][1];
	return child_ctx;
}

// (18:6) {#each dropdownOptions as [value, label]}
function create_each_block$1(ctx) {
	let option;
	let t_value = /*label*/ ctx[7] + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*value*/ ctx[6];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

function create_fragment$2(ctx) {
	let main;
	let div1;
	let label;
	let t0;
	let label_for_value;
	let t1;
	let select;
	let select_id_value;
	let t2;
	let div0;
	let mounted;
	let dispose;
	let each_value = /*dropdownOptions*/ ctx[2];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c() {
			main = element("main");
			div1 = element("div");
			label = element("label");
			t0 = text("Type:");
			t1 = space();
			select = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			div0 = element("div");
			div0.innerHTML = `<svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path></svg>`;
			attr(label, "for", label_for_value = "qtype-" + /*id*/ ctx[1]);
			attr(label, "class", "absolute inset-y-3 left-2 hidden lg:block uppercase tracking-wide text-gray-400 text-xs font-bold");
			attr(select, "id", select_id_value = "qtype-" + /*id*/ ctx[1]);
			attr(select, "class", "dropdown svelte-1cnreoq");
			if (/*questionType*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[5].call(select));
			attr(div0, "class", "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700");
			attr(div1, "class", "relative");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, div1);
			append(div1, label);
			append(label, t0);
			append(div1, t1);
			append(div1, select);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, /*questionType*/ ctx[0]);
			append(div1, t2);
			append(div1, div0);

			if (!mounted) {
				dispose = [
					listen(select, "change", /*select_change_handler*/ ctx[5]),
					listen(select, "input", prevent_default(/*handleInput*/ ctx[3]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*id*/ 2 && label_for_value !== (label_for_value = "qtype-" + /*id*/ ctx[1])) {
				attr(label, "for", label_for_value);
			}

			if (dirty & /*dropdownOptions*/ 4) {
				each_value = /*dropdownOptions*/ ctx[2];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty & /*id*/ 2 && select_id_value !== (select_id_value = "qtype-" + /*id*/ ctx[1])) {
				attr(select, "id", select_id_value);
			}

			if (dirty & /*questionType, dropdownOptions*/ 5) {
				select_option(select, /*questionType*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(main);
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { questionType } = $$props;
	let { id = "qt" } = $$props;

	const dropdownOptions = [
		[SurveyBuilderTypes.TextInput, 'User input'],
		[SurveyBuilderTypes.SingleSelect, 'Single option'],
		[SurveyBuilderTypes.MultipleSelect, 'Multiple options'],
		[SurveyBuilderTypes.StarsRating, 'Rating']
	];

	let { onChange } = $$props;
	const handleInput = evt => onChange(evt.target.value);

	function select_change_handler() {
		questionType = select_value(this);
		$$invalidate(0, questionType);
		$$invalidate(2, dropdownOptions);
	}

	$$self.$$set = $$props => {
		if ('questionType' in $$props) $$invalidate(0, questionType = $$props.questionType);
		if ('id' in $$props) $$invalidate(1, id = $$props.id);
		if ('onChange' in $$props) $$invalidate(4, onChange = $$props.onChange);
	};

	return [
		questionType,
		id,
		dropdownOptions,
		handleInput,
		onChange,
		select_change_handler
	];
}

class TypeSelector extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { questionType: 0, id: 1, onChange: 4 });
	}
}

function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}

function flip(node, { from, to }, params = {}) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;
    const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
    const dx = (from.left + from.width * ox / to.width) - (to.left + ox);
    const dy = (from.top + from.height * oy / to.height) - (to.top + oy);
    const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
    return {
        delay,
        duration: is_function(duration) ? duration(Math.sqrt(dx * dx + dy * dy)) : duration,
        easing,
        css: (t, u) => {
            const x = u * dx;
            const y = u * dy;
            const sx = t + u * from.width / to.width;
            const sy = t + u * from.height / to.height;
            return `transform: ${transform} translate(${x}px, ${y}px) scale(${sx}, ${sy});`;
        }
    };
}

const randomBase32 = () => (Math.random()).toString(32).substr(2);
const genId = (prefix = 'q') => `${prefix}-${randomBase32()}`;

/* src/SurveyBuilder/Questions.svelte generated by Svelte v3.42.4 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[24] = list[i];
	child_ctx[25] = list;
	child_ctx[26] = i;
	return child_ctx;
}

// (66:10) {#if idx < questions.length - 1}
function create_if_block_8(ctx) {
	let button;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[12](/*idx*/ ctx[26]);
	}

	return {
		c() {
			button = element("button");
			button.textContent = "↓";
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!mounted) {
				dispose = listen(button, "click", prevent_default(click_handler));
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

// (69:12) {#if idx > 0}
function create_if_block_7(ctx) {
	let button;
	let mounted;
	let dispose;

	function click_handler_1() {
		return /*click_handler_1*/ ctx[13](/*idx*/ ctx[26]);
	}

	return {
		c() {
			button = element("button");
			button.textContent = "↑";
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!mounted) {
				dispose = listen(button, "click", prevent_default(click_handler_1));
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

// (72:12) {:else}
function create_else_block(ctx) {
	let button0;
	let t1;
	let button1;
	let mounted;
	let dispose;

	function click_handler_3() {
		return /*click_handler_3*/ ctx[15](/*idx*/ ctx[26]);
	}

	return {
		c() {
			button0 = element("button");
			button0.textContent = "× Yes, delete";
			t1 = space();
			button1 = element("button");
			button1.textContent = "Cancel";
			attr(button0, "class", "danger");
			attr(button1, "class", "warning");
		},
		m(target, anchor) {
			insert(target, button0, anchor);
			insert(target, t1, anchor);
			insert(target, button1, anchor);

			if (!mounted) {
				dispose = [
					listen(button0, "click", prevent_default(click_handler_3)),
					listen(button1, "click", prevent_default(/*click_handler_4*/ ctx[16]))
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			if (detaching) detach(button0);
			if (detaching) detach(t1);
			if (detaching) detach(button1);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (70:12) {#if deleteConfirmation !== idx}
function create_if_block_6(ctx) {
	let button;
	let mounted;
	let dispose;

	function click_handler_2() {
		return /*click_handler_2*/ ctx[14](/*idx*/ ctx[26]);
	}

	return {
		c() {
			button = element("button");
			button.textContent = "× Delete";
			attr(button, "class", "warning");
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!mounted) {
				dispose = listen(button, "click", prevent_default(click_handler_2));
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

// (78:8) {#if !parentType}
function create_if_block_3(ctx) {
	let div;
	let typeselector;
	let t0;
	let label;
	let input;
	let t1;
	let t2;
	let t3;
	let current;
	let mounted;
	let dispose;

	function func(...args) {
		return /*func*/ ctx[17](/*idx*/ ctx[26], ...args);
	}

	typeselector = new TypeSelector({
			props: {
				id: /*item*/ ctx[24].id,
				questionType: /*item*/ ctx[24].type,
				onChange: func
			}
		});

	function input_change_handler() {
		/*input_change_handler*/ ctx[18].call(input, /*each_value*/ ctx[25], /*idx*/ ctx[26]);
	}

	let if_block0 = /*customInputNames*/ ctx[2] && create_if_block_5(ctx);
	let if_block1 = /*item*/ ctx[24].type === SurveyBuilderTypes.StarsRating && create_if_block_4(ctx);

	return {
		c() {
			div = element("div");
			create_component(typeselector.$$.fragment);
			t0 = space();
			label = element("label");
			input = element("input");
			t1 = text("\n            Required");
			t2 = space();
			if (if_block0) if_block0.c();
			t3 = space();
			if (if_block1) if_block1.c();
			attr(input, "type", "checkbox");
			attr(label, "class", "mx-4 whitespace-nowrap");
			attr(div, "class", "flex w-3/4 items-center ml-8 py-2");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(typeselector, div, null);
			append(div, t0);
			append(div, label);
			append(label, input);
			input.checked = /*item*/ ctx[24].required;
			append(label, t1);
			append(div, t2);
			if (if_block0) if_block0.m(div, null);
			append(div, t3);
			if (if_block1) if_block1.m(div, null);
			current = true;

			if (!mounted) {
				dispose = listen(input, "change", input_change_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const typeselector_changes = {};
			if (dirty & /*questions*/ 1) typeselector_changes.id = /*item*/ ctx[24].id;
			if (dirty & /*questions*/ 1) typeselector_changes.questionType = /*item*/ ctx[24].type;
			if (dirty & /*questions*/ 1) typeselector_changes.onChange = func;
			typeselector.$set(typeselector_changes);

			if (dirty & /*questions*/ 1) {
				input.checked = /*item*/ ctx[24].required;
			}

			if (/*customInputNames*/ ctx[2]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_5(ctx);
					if_block0.c();
					if_block0.m(div, t3);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*item*/ ctx[24].type === SurveyBuilderTypes.StarsRating) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_4(ctx);
					if_block1.c();
					if_block1.m(div, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(typeselector.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(typeselector.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(typeselector);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			dispose();
		}
	};
}

// (89:10) {#if  customInputNames}
function create_if_block_5(ctx) {
	let div;
	let label;
	let t0;
	let label_for_value;
	let t1;
	let input;
	let input_id_value;
	let mounted;
	let dispose;

	function input_input_handler_1() {
		/*input_input_handler_1*/ ctx[19].call(input, /*each_value*/ ctx[25], /*idx*/ ctx[26]);
	}

	return {
		c() {
			div = element("div");
			label = element("label");
			t0 = text("Name:");
			t1 = space();
			input = element("input");
			attr(label, "class", "label-inline svelte-r3h0zx");
			attr(label, "for", label_for_value = "name-" + /*item*/ ctx[24].id);
			attr(input, "id", input_id_value = "name-" + /*item*/ ctx[24].id);
			attr(input, "class", "w-40 lg:w-64 px-4 svelte-r3h0zx");
			attr(input, "type", "text");
			attr(input, "placeholder", "inputName");
			attr(div, "class", "flex-auto relative mr-4");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, label);
			append(label, t0);
			append(div, t1);
			append(div, input);
			set_input_value(input, /*item*/ ctx[24].name);

			if (!mounted) {
				dispose = listen(input, "input", input_input_handler_1);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*questions*/ 1 && label_for_value !== (label_for_value = "name-" + /*item*/ ctx[24].id)) {
				attr(label, "for", label_for_value);
			}

			if (dirty & /*questions*/ 1 && input_id_value !== (input_id_value = "name-" + /*item*/ ctx[24].id)) {
				attr(input, "id", input_id_value);
			}

			if (dirty & /*questions*/ 1 && input.value !== /*item*/ ctx[24].name) {
				set_input_value(input, /*item*/ ctx[24].name);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (95:10) {#if item.type === SurveyBuilderTypes.StarsRating}
function create_if_block_4(ctx) {
	let div;
	let label;
	let t0;
	let label_for_value;
	let t1;
	let input;
	let input_id_value;
	let mounted;
	let dispose;

	function input_input_handler_2() {
		/*input_input_handler_2*/ ctx[20].call(input, /*each_value*/ ctx[25], /*idx*/ ctx[26]);
	}

	return {
		c() {
			div = element("div");
			label = element("label");
			t0 = text("Max:");
			t1 = space();
			input = element("input");
			attr(label, "class", "label-inline svelte-r3h0zx");
			attr(label, "for", label_for_value = "opts-" + /*item*/ ctx[24].id);
			attr(input, "id", input_id_value = "opts-" + /*item*/ ctx[24].id);
			attr(input, "class", "w-24 lg:w-32 svelte-r3h0zx");
			attr(input, "type", "number");
			attr(input, "placeholder", "5");
			attr(div, "class", "relative flex-auto");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, label);
			append(label, t0);
			append(div, t1);
			append(div, input);
			set_input_value(input, /*item*/ ctx[24].options);

			if (!mounted) {
				dispose = listen(input, "input", input_input_handler_2);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*questions*/ 1 && label_for_value !== (label_for_value = "opts-" + /*item*/ ctx[24].id)) {
				attr(label, "for", label_for_value);
			}

			if (dirty & /*questions*/ 1 && input_id_value !== (input_id_value = "opts-" + /*item*/ ctx[24].id)) {
				attr(input, "id", input_id_value);
			}

			if (dirty & /*questions*/ 1 && to_number(input.value) !== /*item*/ ctx[24].options) {
				set_input_value(input, /*item*/ ctx[24].options);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (104:8) {#if !parentType}
function create_if_block_1$1(ctx) {
	let div;
	let current;
	let if_block = /*item*/ ctx[24].type !== SurveyBuilderTypes.StarsRating && /*item*/ ctx[24].type !== SurveyBuilderTypes.TextInput && create_if_block_2(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", "ml-8 w-3/4");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			current = true;
		},
		p(ctx, dirty) {
			if (/*item*/ ctx[24].type !== SurveyBuilderTypes.StarsRating && /*item*/ ctx[24].type !== SurveyBuilderTypes.TextInput) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*questions*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
		}
	};
}

// (106:10) {#if item.type !== SurveyBuilderTypes.StarsRating && item.type !== SurveyBuilderTypes.TextInput}
function create_if_block_2(ctx) {
	let questions_1;
	let updating_questions;
	let updating_parentType;
	let t0;
	let button;
	let current;
	let mounted;
	let dispose;

	function questions_1_questions_binding(value) {
		/*questions_1_questions_binding*/ ctx[21](value, /*item*/ ctx[24]);
	}

	function questions_1_parentType_binding(value) {
		/*questions_1_parentType_binding*/ ctx[22](value, /*item*/ ctx[24]);
	}

	let questions_1_props = {};

	if (/*item*/ ctx[24].answers !== void 0) {
		questions_1_props.questions = /*item*/ ctx[24].answers;
	}

	if (/*item*/ ctx[24].type !== void 0) {
		questions_1_props.parentType = /*item*/ ctx[24].type;
	}

	questions_1 = new Questions({ props: questions_1_props });
	binding_callbacks.push(() => bind(questions_1, 'questions', questions_1_questions_binding));
	binding_callbacks.push(() => bind(questions_1, 'parentType', questions_1_parentType_binding));

	function click_handler_5() {
		return /*click_handler_5*/ ctx[23](/*idx*/ ctx[26]);
	}

	return {
		c() {
			create_component(questions_1.$$.fragment);
			t0 = space();
			button = element("button");
			button.textContent = "+ Answer";
			attr(button, "class", "secondary w-full");
		},
		m(target, anchor) {
			mount_component(questions_1, target, anchor);
			insert(target, t0, anchor);
			insert(target, button, anchor);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", prevent_default(click_handler_5));
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const questions_1_changes = {};

			if (!updating_questions && dirty & /*questions*/ 1) {
				updating_questions = true;
				questions_1_changes.questions = /*item*/ ctx[24].answers;
				add_flush_callback(() => updating_questions = false);
			}

			if (!updating_parentType && dirty & /*questions*/ 1) {
				updating_parentType = true;
				questions_1_changes.parentType = /*item*/ ctx[24].type;
				add_flush_callback(() => updating_parentType = false);
			}

			questions_1.$set(questions_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(questions_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(questions_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(questions_1, detaching);
			if (detaching) detach(t0);
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

// (57:4) {#each questions as item, idx (item.id)}
function create_each_block(key_1, ctx) {
	let li;
	let div2;
	let span;
	let t0_value = /*idx*/ ctx[26] + 1 + "";
	let t0;
	let t1;
	let t2;
	let div0;
	let label;
	let t3;
	let label_for_value;
	let t4;
	let input;
	let input_id_value;
	let t5;
	let div1;
	let t6;
	let t7;
	let t8;
	let t9;
	let rect;
	let stop_animation = noop;
	let current;
	let mounted;
	let dispose;

	function input_input_handler() {
		/*input_input_handler*/ ctx[11].call(input, /*each_value*/ ctx[25], /*idx*/ ctx[26]);
	}

	let if_block0 = /*idx*/ ctx[26] < /*questions*/ ctx[0].length - 1 && create_if_block_8(ctx);
	let if_block1 = /*idx*/ ctx[26] > 0 && create_if_block_7(ctx);

	function select_block_type(ctx, dirty) {
		if (/*deleteConfirmation*/ ctx[3] !== /*idx*/ ctx[26]) return create_if_block_6;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block2 = current_block_type(ctx);
	let if_block3 = !/*parentType*/ ctx[1] && create_if_block_3(ctx);
	let if_block4 = !/*parentType*/ ctx[1] && create_if_block_1$1(ctx);

	return {
		key: key_1,
		first: null,
		c() {
			li = element("li");
			div2 = element("div");
			span = element("span");
			t0 = text(t0_value);
			t1 = text(".");
			t2 = space();
			div0 = element("div");
			label = element("label");
			t3 = text("Title:");
			t4 = space();
			input = element("input");
			t5 = space();
			div1 = element("div");
			if (if_block0) if_block0.c();
			t6 = space();
			if (if_block1) if_block1.c();
			t7 = space();
			if_block2.c();
			t8 = space();
			if (if_block3) if_block3.c();
			t9 = space();
			if (if_block4) if_block4.c();
			attr(span, "class", "number w-8 text-xl");
			attr(label, "class", "label-inline svelte-r3h0zx");
			attr(label, "for", label_for_value = "title-" + /*item*/ ctx[24].id);
			attr(input, "id", input_id_value = "title-" + /*item*/ ctx[24].id);
			attr(input, "class", "w-full px-4 svelte-r3h0zx");
			attr(input, "type", "text");
			attr(div0, "class", "flex-auto relative");
			attr(div1, "class", "actions w-auto px-4 content-end text-right");
			attr(div2, "class", "w-full flex items-center py-2");
			attr(li, "class", "svelte-r3h0zx");
			this.first = li;
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, div2);
			append(div2, span);
			append(span, t0);
			append(span, t1);
			append(div2, t2);
			append(div2, div0);
			append(div0, label);
			append(label, t3);
			append(div0, t4);
			append(div0, input);
			set_input_value(input, /*item*/ ctx[24].title);
			append(div2, t5);
			append(div2, div1);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t6);
			if (if_block1) if_block1.m(div1, null);
			append(div1, t7);
			if_block2.m(div1, null);
			append(li, t8);
			if (if_block3) if_block3.m(li, null);
			append(li, t9);
			if (if_block4) if_block4.m(li, null);
			current = true;

			if (!mounted) {
				dispose = listen(input, "input", input_input_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if ((!current || dirty & /*questions*/ 1) && t0_value !== (t0_value = /*idx*/ ctx[26] + 1 + "")) set_data(t0, t0_value);

			if (!current || dirty & /*questions*/ 1 && label_for_value !== (label_for_value = "title-" + /*item*/ ctx[24].id)) {
				attr(label, "for", label_for_value);
			}

			if (!current || dirty & /*questions*/ 1 && input_id_value !== (input_id_value = "title-" + /*item*/ ctx[24].id)) {
				attr(input, "id", input_id_value);
			}

			if (dirty & /*questions*/ 1 && input.value !== /*item*/ ctx[24].title) {
				set_input_value(input, /*item*/ ctx[24].title);
			}

			if (/*idx*/ ctx[26] < /*questions*/ ctx[0].length - 1) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_8(ctx);
					if_block0.c();
					if_block0.m(div1, t6);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*idx*/ ctx[26] > 0) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_7(ctx);
					if_block1.c();
					if_block1.m(div1, t7);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
				if_block2.p(ctx, dirty);
			} else {
				if_block2.d(1);
				if_block2 = current_block_type(ctx);

				if (if_block2) {
					if_block2.c();
					if_block2.m(div1, null);
				}
			}

			if (!/*parentType*/ ctx[1]) {
				if (if_block3) {
					if_block3.p(ctx, dirty);

					if (dirty & /*parentType*/ 2) {
						transition_in(if_block3, 1);
					}
				} else {
					if_block3 = create_if_block_3(ctx);
					if_block3.c();
					transition_in(if_block3, 1);
					if_block3.m(li, t9);
				}
			} else if (if_block3) {
				group_outros();

				transition_out(if_block3, 1, 1, () => {
					if_block3 = null;
				});

				check_outros();
			}

			if (!/*parentType*/ ctx[1]) {
				if (if_block4) {
					if_block4.p(ctx, dirty);

					if (dirty & /*parentType*/ 2) {
						transition_in(if_block4, 1);
					}
				} else {
					if_block4 = create_if_block_1$1(ctx);
					if_block4.c();
					transition_in(if_block4, 1);
					if_block4.m(li, null);
				}
			} else if (if_block4) {
				group_outros();

				transition_out(if_block4, 1, 1, () => {
					if_block4 = null;
				});

				check_outros();
			}
		},
		r() {
			rect = li.getBoundingClientRect();
		},
		f() {
			fix_position(li);
			stop_animation();
		},
		a() {
			stop_animation();
			stop_animation = create_animation(li, rect, flip, { duration: 250 });
		},
		i(local) {
			if (current) return;
			transition_in(if_block3);
			transition_in(if_block4);
			current = true;
		},
		o(local) {
			transition_out(if_block3);
			transition_out(if_block4);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if_block2.d();
			if (if_block3) if_block3.d();
			if (if_block4) if_block4.d();
			mounted = false;
			dispose();
		}
	};
}

// (114:4) {#if !parentType}
function create_if_block$1(ctx) {
	let li;
	let button;
	let mounted;
	let dispose;

	return {
		c() {
			li = element("li");
			button = element("button");
			button.textContent = "+ Add question";
			attr(button, "class", "w-full");
			attr(li, "class", "add-question svelte-r3h0zx");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, button);

			if (!mounted) {
				dispose = listen(button, "click", prevent_default(/*addRow*/ ctx[10]));
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$1(ctx) {
	let main;
	let ol;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let t;
	let ol_class_value;
	let current;
	let each_value = /*questions*/ ctx[0];
	const get_key = ctx => /*item*/ ctx[24].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	let if_block = !/*parentType*/ ctx[1] && create_if_block$1(ctx);

	return {
		c() {
			main = element("main");
			ol = element("ol");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
			if (if_block) if_block.c();
			attr(ol, "class", ol_class_value = "" + (null_to_empty(/*parentType*/ ctx[1] ? 'answers' : 'questions') + " svelte-r3h0zx"));
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, ol);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ol, null);
			}

			append(ol, t);
			if (if_block) if_block.m(ol, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*addAnswer, questions, SurveyBuilderTypes, parentType, customInputNames, onQuestionTypeChange, deleteRow, deleteConfirmation, deleteRowConfirm, moveDown, moveUp*/ 1023) {
				each_value = /*questions*/ ctx[0];
				group_outros();
				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ol, fix_and_outro_and_destroy_block, create_each_block, t, get_each_context);
				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
				check_outros();
			}

			if (!/*parentType*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					if_block.m(ol, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (!current || dirty & /*parentType*/ 2 && ol_class_value !== (ol_class_value = "" + (null_to_empty(/*parentType*/ ctx[1] ? 'answers' : 'questions') + " svelte-r3h0zx"))) {
				attr(ol, "class", ol_class_value);
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(main);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			if (if_block) if_block.d();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	
	let { questions = [] } = $$props;
	let { parentType = null } = $$props;
	let { customInputNames = true } = $$props;
	let deleteConfirmation = -1;

	function deleteRow(idx) {
		$$invalidate(3, deleteConfirmation = idx);
	}

	function deleteRowConfirm(idx) {
		questions.splice(idx, 1);
		$$invalidate(0, questions);
		$$invalidate(3, deleteConfirmation = -1);
	}

	function onQuestionTypeChange(idx, newType) {
		$$invalidate(0, questions[idx].type = newType, questions);
		$$invalidate(0, questions);
	}

	function moveUp(idx) {
		const [item] = questions.splice(idx + 1, 1);
		questions.splice(idx, 0, item);
		$$invalidate(0, questions);
	}

	function moveDown(idx) {
		const [item] = questions.splice(idx, 1);
		questions.splice(idx - 1, 0, item);
		$$invalidate(0, questions);
	}

	function addAnswer(idx) {
		if (!Array.isArray(questions[idx].answers)) {
			$$invalidate(0, questions[idx].answers = [], questions);
		}

		questions[idx].answers.push({
			id: genId(),
			title: 'Answer ',
			name: '',
			type: SurveyBuilderTypes.TextValue
		});

		$$invalidate(0, questions);
	}

	function addRow() {
		questions.push({
			id: genId(),
			title: 'New question',
			required: true,
			type: SurveyBuilderTypes.TextInput
		});

		$$invalidate(0, questions);
	}

	function input_input_handler(each_value, idx) {
		each_value[idx].title = this.value;
		$$invalidate(0, questions);
	}

	const click_handler = idx => moveUp(idx);
	const click_handler_1 = idx => moveDown(idx);
	const click_handler_2 = idx => deleteRow(idx);
	const click_handler_3 = idx => deleteRowConfirm(idx);
	const click_handler_4 = () => deleteRow(-1);
	const func = (idx, value) => onQuestionTypeChange(idx, value);

	function input_change_handler(each_value, idx) {
		each_value[idx].required = this.checked;
		$$invalidate(0, questions);
	}

	function input_input_handler_1(each_value, idx) {
		each_value[idx].name = this.value;
		$$invalidate(0, questions);
	}

	function input_input_handler_2(each_value, idx) {
		each_value[idx].options = to_number(this.value);
		$$invalidate(0, questions);
	}

	function questions_1_questions_binding(value, item) {
		if ($$self.$$.not_equal(item.answers, value)) {
			item.answers = value;
			$$invalidate(0, questions);
		}
	}

	function questions_1_parentType_binding(value, item) {
		if ($$self.$$.not_equal(item.type, value)) {
			item.type = value;
			$$invalidate(0, questions);
		}
	}

	const click_handler_5 = idx => addAnswer(idx);

	$$self.$$set = $$props => {
		if ('questions' in $$props) $$invalidate(0, questions = $$props.questions);
		if ('parentType' in $$props) $$invalidate(1, parentType = $$props.parentType);
		if ('customInputNames' in $$props) $$invalidate(2, customInputNames = $$props.customInputNames);
	};

	return [
		questions,
		parentType,
		customInputNames,
		deleteConfirmation,
		deleteRow,
		deleteRowConfirm,
		onQuestionTypeChange,
		moveUp,
		moveDown,
		addAnswer,
		addRow,
		input_input_handler,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3,
		click_handler_4,
		func,
		input_change_handler,
		input_input_handler_1,
		input_input_handler_2,
		questions_1_questions_binding,
		questions_1_parentType_binding,
		click_handler_5
	];
}

class Questions extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
			questions: 0,
			parentType: 1,
			customInputNames: 2
		});
	}
}

/* src/SurveyBuilder/SurveyBuilder.svelte generated by Svelte v3.42.4 */

function create_if_block_1(ctx) {
	let div;
	let label;
	let t;
	let input;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			label = element("label");
			t = text("Title:\n        ");
			input = element("input");
			attr(input, "type", "text");
			attr(div, "class", "my-4");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, label);
			append(label, t);
			append(label, input);
			set_input_value(input, /*snapshot*/ ctx[0].title);

			if (!mounted) {
				dispose = listen(input, "input", /*input_input_handler*/ ctx[7]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*snapshot*/ 1 && input.value !== /*snapshot*/ ctx[0].title) {
				set_input_value(input, /*snapshot*/ ctx[0].title);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (43:2) {#if debug}
function create_if_block(ctx) {
	let h3;
	let t1;
	let pre;
	let t2_value = JSON.stringify(/*snapshot*/ ctx[0], null, 2) + "";
	let t2;

	return {
		c() {
			h3 = element("h3");
			h3.textContent = "Data model:";
			t1 = space();
			pre = element("pre");
			t2 = text(t2_value);
			attr(pre, "class", "debug");
		},
		m(target, anchor) {
			insert(target, h3, anchor);
			insert(target, t1, anchor);
			insert(target, pre, anchor);
			append(pre, t2);
		},
		p(ctx, dirty) {
			if (dirty & /*snapshot*/ 1 && t2_value !== (t2_value = JSON.stringify(/*snapshot*/ ctx[0], null, 2) + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(h3);
			if (detaching) detach(t1);
			if (detaching) detach(pre);
		}
	};
}

function create_fragment(ctx) {
	let main;
	let h1;
	let t0;
	let t1_value = (/*snapshot*/ ctx[0].title || 'no name') + "";
	let t1;
	let t2;
	let t3;
	let t4;
	let div;
	let button;
	let t6;
	let h3;
	let t8;
	let questions;
	let updating_questions;
	let updating_customInputNames;
	let t9;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*haveTitle*/ ctx[2] && create_if_block_1(ctx);

	function questions_questions_binding(value) {
		/*questions_questions_binding*/ ctx[8](value);
	}

	function questions_customInputNames_binding(value) {
		/*questions_customInputNames_binding*/ ctx[9](value);
	}

	let questions_props = {};

	if (/*snapshot*/ ctx[0].questions !== void 0) {
		questions_props.questions = /*snapshot*/ ctx[0].questions;
	}

	if (/*customInputNames*/ ctx[1] !== void 0) {
		questions_props.customInputNames = /*customInputNames*/ ctx[1];
	}

	questions = new Questions({ props: questions_props });
	binding_callbacks.push(() => bind(questions, 'questions', questions_questions_binding));
	binding_callbacks.push(() => bind(questions, 'customInputNames', questions_customInputNames_binding));
	let if_block1 = /*debug*/ ctx[3] && create_if_block(ctx);

	return {
		c() {
			main = element("main");
			h1 = element("h1");
			t0 = text("Survey builder \"");
			t1 = text(t1_value);
			t2 = text("\"");
			t3 = space();
			if (if_block0) if_block0.c();
			t4 = space();
			div = element("div");
			button = element("button");
			button.textContent = "Export";
			t6 = space();
			h3 = element("h3");
			h3.textContent = "Questions:";
			t8 = space();
			create_component(questions.$$.fragment);
			t9 = space();
			if (if_block1) if_block1.c();
			attr(h1, "class", "text-3xl");
			attr(div, "class", "my-4");
			attr(main, "class", "survey-builder container mx-auto font-sans");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, h1);
			append(h1, t0);
			append(h1, t1);
			append(h1, t2);
			append(main, t3);
			if (if_block0) if_block0.m(main, null);
			append(main, t4);
			append(main, div);
			append(div, button);
			append(main, t6);
			append(main, h3);
			append(main, t8);
			mount_component(questions, main, null);
			append(main, t9);
			if (if_block1) if_block1.m(main, null);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", prevent_default(/*handleExport*/ ctx[4]));
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*snapshot*/ 1) && t1_value !== (t1_value = (/*snapshot*/ ctx[0].title || 'no name') + "")) set_data(t1, t1_value);

			if (/*haveTitle*/ ctx[2]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_1(ctx);
					if_block0.c();
					if_block0.m(main, t4);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			const questions_changes = {};

			if (!updating_questions && dirty & /*snapshot*/ 1) {
				updating_questions = true;
				questions_changes.questions = /*snapshot*/ ctx[0].questions;
				add_flush_callback(() => updating_questions = false);
			}

			if (!updating_customInputNames && dirty & /*customInputNames*/ 2) {
				updating_customInputNames = true;
				questions_changes.customInputNames = /*customInputNames*/ ctx[1];
				add_flush_callback(() => updating_customInputNames = false);
			}

			questions.$set(questions_changes);

			if (/*debug*/ ctx[3]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block(ctx);
					if_block1.c();
					if_block1.m(main, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(questions.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(questions.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(main);
			if (if_block0) if_block0.d();
			destroy_component(questions);
			if (if_block1) if_block1.d();
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	
	let { haveTitle = true } = $$props;
	let { customInputNames = true } = $$props;
	let { snapshot = {} } = $$props;

	let { onChange = () => {
		
	} } = $$props;

	let { onExport = () => {
		
	} } = $$props;

	let { debug = false } = $$props;

	function handleExport() {
		if (typeof onExport === 'function') {
			onExport(snapshot);
		} else {
			console.warn('onExport is not defined');
		}
	}

	function input_input_handler() {
		snapshot.title = this.value;
		$$invalidate(0, snapshot);
	}

	function questions_questions_binding(value) {
		if ($$self.$$.not_equal(snapshot.questions, value)) {
			snapshot.questions = value;
			$$invalidate(0, snapshot);
		}
	}

	function questions_customInputNames_binding(value) {
		customInputNames = value;
		$$invalidate(1, customInputNames);
	}

	$$self.$$set = $$props => {
		if ('haveTitle' in $$props) $$invalidate(2, haveTitle = $$props.haveTitle);
		if ('customInputNames' in $$props) $$invalidate(1, customInputNames = $$props.customInputNames);
		if ('snapshot' in $$props) $$invalidate(0, snapshot = $$props.snapshot);
		if ('onChange' in $$props) $$invalidate(5, onChange = $$props.onChange);
		if ('onExport' in $$props) $$invalidate(6, onExport = $$props.onExport);
		if ('debug' in $$props) $$invalidate(3, debug = $$props.debug);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*onChange, snapshot*/ 33) {
			{
				if (typeof onChange === 'function') {
					onChange(snapshot);
				}
			}
		}
	};

	return [
		snapshot,
		customInputNames,
		haveTitle,
		debug,
		handleExport,
		onChange,
		onExport,
		input_input_handler,
		questions_questions_binding,
		questions_customInputNames_binding
	];
}

class SurveyBuilder extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance, create_fragment, safe_not_equal, {
			haveTitle: 2,
			customInputNames: 1,
			snapshot: 0,
			onChange: 5,
			onExport: 6,
			debug: 3
		});
	}
}

window.SurveyBuilderInit = function (opts) {
    if (!opts.target) {
        throw new Error('Please define "target" element');
    }
    const surveyBuilder = new SurveyBuilder({
        target: opts.target,
        props: opts.props,
    });
    return surveyBuilder;
};
