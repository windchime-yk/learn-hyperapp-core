/**
 * this code is virtual-dom framework practice.
 *
 * - original repo: https://github.com/jorgebucaran/hyperapp
 * - original code: https://github.com/jorgebucaran/hyperapp/blob/main/index.js
 * - original license: [MIT License](https://github.com/jorgebucaran/hyperapp/blob/main/LICENSE.md)
 */

const SSR_NODE = 1;
const TEXT_NODE = 3;
const EMPTY_OBJ = {};
const EMPTY_ARR: any = [];
const SVG_NS = "http://www.w3.org/2000/svg";

const id = (a: any) => a;
const map = EMPTY_ARR.map;
const isArray = Array.isArray;
const enqueue =
  typeof requestAnimationFrame !== "undefined"
    ? requestAnimationFrame
    : setTimeout;

const createClass = (obj: any) => {
  let out = "";

  if (typeof obj === "string") return obj;

  if (isArray(obj)) {
    for (let k = 0, tmp; k < obj.length; k++) {
      if ((tmp = createClass(obj[k]))) {
        out += (out && " ") + tmp;
      }
    }
  } else {
    for (let k in obj) {
      if (obj[k]) out += (out && " ") + k;
    }
  }

  return out;
};

const shouldRestart = (a: any, b: any) => {
  for (let k in { ...a, ...b }) {
    if (typeof (isArray((b[k] = a[k])) ? b[k][0] : b[k]) === "function") {
    } else if (a[k] !== b[k]) return true;
  }
};

const patchSubs = (oldSubs: any, newSubs: any, dispatch: any) => {
  for (
    let subs = [], i = 0, oldSub, newSub;
    i < oldSubs.length || i < newSubs.length;
    i++
  ) {
    oldSub = oldSubs[i];
    newSub = newSubs[i];

    subs.push(
      newSub && newSub !== true
        ? !oldSub ||
          newSub[0] !== oldSub[0] ||
          shouldRestart(newSub[1], oldSub[1])
          ? [
              newSub[0],
              newSub[1],
              newSub[0](dispatch, newSub[1]),
              oldSub && oldSub[2](),
            ]
          : oldSub
        : oldSub && oldSub[2]()
    );
  }
  return subs;
};

const getKey = (vdom: any) => vdom == null ? vdom : vdom.key;

const patchProperty = (
  node: any,
  key: any,
  oldValue: any,
  newValue: any,
  listener: any,
  isSvg: any
) => {
  if (key === "key") {
  } else if (key === "style") {
    for (let k in { ...oldValue, ...newValue }) {
      oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];
      if (k[0] === "-") {
        node[key].setProperty(k, oldValue);
      } else {
        node[key][k] = oldValue;
      }
    }
  } else if (key[0] === "o" && key[1] === "n") {
    if (!((node.tag || (node.tag = {}))[(key = key.slice(2))] = newValue)) {
      node.removeEventListener(key, listener);
    } else if (!oldValue) {
      node.addEventListener(key, listener);
    }
  } else if (!isSvg && key !== "list" && key !== "form" && key in node) {
    node[key] = newValue == null ? "" : newValue;
  } else if (
    newValue == null ||
    newValue === false ||
    (key === "class" && !(newValue = createClass(newValue)))
  ) {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, newValue);
  }
};

let createNode = (vdom: any, listener: any, isSvg: any) => {
  let props = vdom.props;
  const node =
    vdom.tag === TEXT_NODE
      ? document.createTextNode(vdom.type)
      : (isSvg = isSvg || vdom.type === "svg")
      ? document.createElementNS(SVG_NS, vdom.type, { is: props.is })
      : document.createElement(vdom.type, { is: props.is });

  for (let k in props) {
    patchProperty(node, k, null, props[k], listener, isSvg);
  }

  for (let i = 0; i < vdom.children.length; i++) {
    node.appendChild(
      createNode(
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
        (vdom.children[i] = maybeVNode(vdom.children[i])),
        listener,
        isSvg
      )
    );
  }

  return (vdom.node = node);
};

const patch = (
  parent: any,
  node: any,
  oldVNode: any,
  newVNode: any,
  listener: any,
  isSvg: any
) => {
  if (oldVNode === newVNode) {
  } else if (
    oldVNode != null &&
    oldVNode.tag === TEXT_NODE &&
    newVNode.tag === TEXT_NODE
  ) {
    if (oldVNode.type !== newVNode.type) node.nodeValue = newVNode.type;
  } else if (oldVNode == null || oldVNode.type !== newVNode.type) {
    node = parent.insertBefore(
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
      createNode((newVNode = maybeVNode(newVNode)), listener, isSvg),
      node
    );
    if (oldVNode != null) {
      parent.removeChild(oldVNode.node);
    }
  } else {
    let tmpVKid;
    let oldVKid;

    let oldKey;
    let newKey;

    const oldProps = oldVNode.props;
    const newProps = newVNode.props;

    const oldVKids = oldVNode.children;
    const newVKids = newVNode.children;

    const oldHead = 0;
    const newHead = 0;
    const oldTail = oldVKids.length - 1;
    const newTail = newVKids.length - 1;

    isSvg = isSvg || newVNode.type === "svg";

    for (let i in { ...oldProps, ...newProps }) {
      if (
        (i === "value" || i === "selected" || i === "checked"
          ? node[i]
          : oldProps[i]) !== newProps[i]
      ) {
        patchProperty(node, i, oldProps[i], newProps[i], listener, isSvg);
      }
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldHead])) == null ||
        oldKey !== getKey(newVKids[newHead])
      ) {
        break;
      }

      patch(
        node,
        oldVKids[oldHead].node,
        oldVKids[oldHead],
        (newVKids[newHead] = maybeVNode(
          newVKids[newHead++],
          oldVKids[oldHead++]
        )),
        listener,
        isSvg
      );
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldTail])) == null ||
        oldKey !== getKey(newVKids[newTail])
      ) {
        break;
      }

      patch(
        node,
        oldVKids[oldTail].node,
        oldVKids[oldTail],
        (newVKids[newTail] = maybeVNode(
          newVKids[newTail--],
          oldVKids[oldTail--]
        )),
        listener,
        isSvg
      );
    }

    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
          createNode(
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
            (newVKids[newHead] = maybeVNode(newVKids[newHead++])),
            listener,
            isSvg
          ),
          (oldVKid = oldVKids[oldHead]) && oldVKid.node
        );
      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        node.removeChild(oldVKids[oldHead++].node);
      }
    } else {
      // @ts-expect-error ts-migrate(2403) FIXME: Subsequent letiable declarations must have the sam... Remove this comment to see the full error message
      for (let keyed = {}, newKeyed = {}, i = oldHead; i <= oldTail; i++) {
        if ((oldKey = oldVKids[i].key) != null) {
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          keyed[oldKey] = oldVKids[i];
        }
      }

      while (newHead <= newTail) {
        oldKey = getKey((oldVKid = oldVKids[oldHead]));
        newKey = getKey(
          (newVKids[newHead] = maybeVNode(newVKids[newHead], oldVKid))
        );

        if (
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          newKeyed[oldKey] ||
          (newKey != null && newKey === getKey(oldVKids[oldHead + 1]))
        ) {
          if (oldKey == null) {
            node.removeChild(oldVKid.node);
          }
          oldHead++;
          continue;
        }

        if (newKey == null || oldVNode.tag === SSR_NODE) {
          if (oldKey == null) {
            patch(
              node,
              oldVKid && oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            newHead++;
          }
          oldHead++;
        } else {
          if (oldKey === newKey) {
            patch(
              node,
              oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            newKeyed[newKey] = true;
            oldHead++;
          } else {
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            if ((tmpVKid = keyed[newKey]) != null) {
              patch(
                node,
                node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
                tmpVKid,
                newVKids[newHead],
                listener,
                isSvg
              );
              // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
              newKeyed[newKey] = true;
            } else {
              patch(
                node,
                oldVKid && oldVKid.node,
                null,
                newVKids[newHead],
                listener,
                isSvg
              );
            }
          }
          newHead++;
        }
      }

      while (oldHead <= oldTail) {
        if (getKey((oldVKid = oldVKids[oldHead++])) == null) {
          node.removeChild(oldVKid.node);
        }
      }

      for (let i in keyed) {
        // @ts-expect-error ts-migrate(7053) FIXME: No index signature with a parameter of type 'strin... Remove this comment to see the full error message
        if (newKeyed[i] == null) {
          // @ts-expect-error ts-migrate(7053) FIXME: No index signature with a parameter of type 'strin... Remove this comment to see the full error message
          node.removeChild(keyed[i].node);
        }
      }
    }
  }

  return (newVNode.node = node);
};

const propsChanged = (a: any, b: any) => {
  for (let k in a) if (a[k] !== b[k]) return true;
  for (let k in b) if (a[k] !== b[k]) return true;
};

const maybeVNode = (newVNode: any, oldVNode: any) =>
  newVNode !== true && newVNode !== false && newVNode
    ? typeof newVNode.tag === "function"
      ? ((!oldVNode ||
          oldVNode.memo == null ||
          propsChanged(oldVNode.memo, newVNode.memo)) &&
          ((oldVNode = newVNode.tag(newVNode.memo)).memo = newVNode.memo),
        oldVNode)
      : newVNode
    : // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
      text("");

const recycleNode = (node: any) =>
  node.nodeType === TEXT_NODE
    ? text(node.nodeValue, node)
    : createVNode(
        node.nodeName.toLowerCase(),
        EMPTY_OBJ,
        map.call(node.childNodes, recycleNode),
        node,
        null,
        SSR_NODE
      );

const createVNode = (
  type: any,
  props: any,
  children: any,
  node: any,
  key: any,
  tag: any
) => ({
  type,
  props,
  children,
  node,
  key,
  tag,
});

export const memo = (tag: any, memo: any) => ({ tag, memo });

export const text = (value: any, node: any) =>
  createVNode(value, EMPTY_OBJ, EMPTY_ARR, node, null, TEXT_NODE);

export const h = (type: any, props: any, children: any) =>
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 6 arguments, but got 5.
  createVNode(
    type,
    props,
    isArray(children) ? children : children == null ? EMPTY_ARR : [children],
    null,
    props.key
  );

export const app = (props: any) => {
  const view = props.view;
  const node = props.node;
  const subscriptions = props.subscriptions;
  const vdom = node && recycleNode(node);
  const subs: any = [];
  let doing: any;
  let state: any;

  const setState = (newState: any) => {
    if (state !== newState) {
      state = newState;
      if (subscriptions) {
        subs = patchSubs(subs, subscriptions(state), dispatch);
      }
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'true' is not assignable to param... Remove this comment to see the full error message
      if (view && !doing) enqueue(render, (doing = true));
    }
  };

  const dispatch = (props.middleware || id)((action: any, props: any) =>
    typeof action === "function"
      ? dispatch(action(state, props))
      : isArray(action)
      ? typeof action[0] === "function"
        ? dispatch(action[0], action[1])
        : action
            .slice(1)
            .map(
              (fx) => fx && fx !== true && fx[0](dispatch, fx[1]),
              setState(action[0])
            )
      : setState(action)
  );

  const listener = function (event: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    dispatch(this.tag[event.type], event);
  };

  const render = () =>
    (node = patch(
      node.parentNode,
      node,
      vdom,
      (vdom = view(state)),
      listener,
      (doing = false)
    ));

  dispatch(props.init);
};
