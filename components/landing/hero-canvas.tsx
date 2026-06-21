"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

// "Minimal Momentum" — an abstract, discipline-agnostic particle form that
// slowly drifts and responds to the pointer. Deliberately sport-neutral so it
// still fits if the app grows beyond triathlon. Lazy-loaded (ssr:false) by the
// landing page; renders nothing here when prefers-reduced-motion is set (the
// page shows a static gradient fallback instead).
export function HeroCanvas() {
    const mountRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const scene = new THREE.Scene()

        const camera = new THREE.PerspectiveCamera(
            55,
            mount.clientWidth / mount.clientHeight,
            0.1,
            1000
        )
        camera.position.z = 28

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(mount.clientWidth, mount.clientHeight)
        mount.appendChild(renderer.domElement)

        // Flowing torus-knot of points — its sweeping curves read as motion /
        // momentum without depicting any specific sport. Fewer points on small
        // screens to keep phones smooth.
        const isSmall = window.innerWidth < 640
        const geometry = new THREE.TorusKnotGeometry(
            9,
            2.6,
            isSmall ? 220 : 420,
            isSmall ? 16 : 28
        )
        // Drop the geometry's uv attribute: with it present, three enables
        // USE_POINTS_UV and samples the sprite at each point's per-vertex uv (a
        // single texel) instead of across gl_PointCoord — which renders every
        // point as a flat square. Removing it restores per-sprite round dots.
        geometry.deleteAttribute("uv")

        // Soft circular sprite so points render as round dots rather than the
        // default hard squares. White texture so material.color still tints it.
        const makeCircleTexture = () => {
            const size = 64
            const canvas = document.createElement("canvas")
            canvas.width = canvas.height = size
            const ctx = canvas.getContext("2d")!
            const g = ctx.createRadialGradient(
                size / 2,
                size / 2,
                0,
                size / 2,
                size / 2,
                size / 2
            )
            // Round dot with a soft edge. Kept airy (not a hard opaque disc) so
            // the dense knot reads as a fine field rather than a solid mass.
            g.addColorStop(0, "rgba(255,255,255,1)")
            g.addColorStop(0.55, "rgba(255,255,255,0.85)")
            g.addColorStop(1, "rgba(255,255,255,0)")
            ctx.fillStyle = g
            ctx.fillRect(0, 0, size, size)
            const tex = new THREE.CanvasTexture(canvas)
            tex.colorSpace = THREE.SRGBColorSpace
            return tex
        }
        const sprite = makeCircleTexture()

        const material = new THREE.PointsMaterial({
            // Fine dots — round sprites cover less area than the old squares, so
            // the dense knot stays a delicate field at this small size.
            size: isSmall ? 0.14 : 0.11,
            sizeAttenuation: true,
            map: sprite,
            // Discard fully-transparent fragments so the square quad never shows.
            alphaTest: 0.01,
            transparent: true,
            opacity: 0.5,
            // Avoid the opaque-square z-buffer artifacts when sprites overlap.
            depthWrite: false,
        })

        // Colour the points from the live theme token so it works in both
        // themes, and recolour when the user flips the toggle.
        const applyThemeColor = () => {
            const fg = getComputedStyle(document.documentElement)
                .getPropertyValue("--foreground")
                .trim()
            if (fg) material.color.set(fg)
        }
        applyThemeColor()
        const themeObserver = new MutationObserver(applyThemeColor)
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        })

        const points = new THREE.Points(geometry, material)
        scene.add(points)

        // Pointer parallax (lerped for smoothness).
        const pointer = { x: 0, y: 0 }
        const target = { x: 0, y: 0 }
        const onPointerMove = (e: PointerEvent) => {
            target.x = (e.clientX / window.innerWidth - 0.5) * 2
            target.y = (e.clientY / window.innerHeight - 0.5) * 2
        }
        window.addEventListener("pointermove", onPointerMove, { passive: true })

        const onResize = () => {
            if (!mount) return
            camera.aspect = mount.clientWidth / mount.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(mount.clientWidth, mount.clientHeight)
        }
        window.addEventListener("resize", onResize)

        let raf = 0
        const clock = new THREE.Clock()
        let running = true

        const animate = () => {
            if (!running) return
            raf = requestAnimationFrame(animate)
            const t = clock.getElapsedTime()

            points.rotation.y = t * 0.12
            points.rotation.z = t * 0.05

            pointer.x += (target.x - pointer.x) * 0.04
            pointer.y += (target.y - pointer.y) * 0.04
            points.rotation.x = pointer.y * 0.4
            points.position.x = pointer.x * 2.2

            renderer.render(scene, camera)
        }
        animate()

        // Pause the render loop when the tab is hidden to save battery/CPU.
        const onVisibility = () => {
            if (document.hidden) {
                running = false
                cancelAnimationFrame(raf)
            } else if (!running) {
                running = true
                clock.getDelta() // discard the gap so motion doesn't jump
                animate()
            }
        }
        document.addEventListener("visibilitychange", onVisibility)

        return () => {
            running = false
            cancelAnimationFrame(raf)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("resize", onResize)
            document.removeEventListener("visibilitychange", onVisibility)
            themeObserver.disconnect()
            geometry.dispose()
            material.dispose()
            sprite.dispose()
            renderer.dispose()
            if (renderer.domElement.parentNode === mount) {
                mount.removeChild(renderer.domElement)
            }
        }
    }, [])

    return <div ref={mountRef} className="absolute inset-0 h-full w-full" />
}

export default HeroCanvas
