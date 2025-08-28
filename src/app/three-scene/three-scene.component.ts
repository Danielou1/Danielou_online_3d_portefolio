import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NavigationEnd, Router } from '@angular/router'; // <-- IMPORT ADDED HERE
import html2canvas from 'html2canvas';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-three-scene',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`canvas { width: 100%; height: 100vh; display: block; }`]
})
export class ThreeSceneComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private router: Router) {}

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId = 0;
  private signPanels: { mesh: THREE.Mesh, label: string }[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private screenPanel!: THREE.Mesh;
  private hoveredObject: THREE.Object3D | null = null;

  private onCanvasClick = (event: MouseEvent): void => {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.signPanels.map(p => p.mesh));

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const clicked = this.signPanels.find(p => p.mesh === clickedObject);

      if (clicked) {
        console.log('🧭 Panneau cliqué :', clicked.label);

        if (clicked.label === 'main' || clickedObject.name === 'main-screen') {
          this.router.navigate(['/profil']);
        } else if (clicked.label === 'giant') {
          this.router.navigate(['/screen'], { queryParams: { section: 'profil' } });
        } else {
          this.router.navigate([`/${clicked.label.toLowerCase()}`]);
        }
      }
    }
  };

  private onPointerMove = (event: MouseEvent): void => {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.signPanels.map(p => p.mesh));

    const intersectedObject = intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;

    // If we are no longer hovering over the same object
    if (this.hoveredObject && this.hoveredObject !== intersectedObject) {
        this.hoveredObject.scale.set(1, 1, 1);
        this.hoveredObject = null;
    }

    // If we are hovering over a new object
    if (intersectedObject && this.hoveredObject !== intersectedObject) {
        this.hoveredObject = intersectedObject;
        this.hoveredObject.scale.set(1.1, 1.1, 1.1);
    }
  };

  async ngOnInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.initThree();
    await this.createPanelWithContent(); // Initial content
    this.animate();

    // Subscribe to router events to update the screen on navigation
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Use a small timeout to ensure the new component is rendered
      setTimeout(() => {
        this.updatePanelContent();
      }, 100);
    });
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationId);
      window.removeEventListener('resize', this.onWindowResize);
    }

    if (this.canvasRef?.nativeElement) {
      this.canvasRef.nativeElement.removeEventListener('click', this.onCanvasClick);
      this.canvasRef.nativeElement.removeEventListener('pointermove', this.onPointerMove);
    }

    this.renderer?.dispose();
  }

   private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    this.scene = new THREE.Scene();
    this.addSky();
    this.addTrees();
    this.addBahnhofLampPost();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(-2, 3, 10);
    this.addGiantScreens();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true; // Enable shadows
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Enable damping (smoothness)
    this.controls.dampingFactor = 0.05; // Slightly increased damping
    this.controls.minDistance = 5; // Minimum zoom distance
    this.controls.maxDistance = 15; // Maximum zoom distance
    this.controls.minPolarAngle = Math.PI / 4; // Limit vertical rotation (look up less)
    this.controls.maxPolarAngle = Math.PI / 2.1; // Limit vertical rotation (look down less)
    this.controls.minAzimuthAngle = -Math.PI / 3; // Limit horizontal rotation (left)
    this.controls.maxAzimuthAngle = Math.PI / 3; // Limit horizontal rotation (right)
    this.controls.enablePan = false; // Disable panning
    this.controls.target.set(-2, 2, 0);
    this.controls.update();
    canvas.addEventListener('click', this.onCanvasClick);
    canvas.addEventListener('pointermove', this.onPointerMove);


    // Lumières
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3)); // Reduced intensity
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true; // Enable shadow casting for directional light
    // Configure shadow camera for directional light
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    this.scene.add(dirLight);

    // Sol extérieur
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x707070 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true; // Ground receives shadows
    this.scene.add(ground);

    // Murs
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 0.1), wallMaterial);
    backWall.position.set(0, 2, -2);
    backWall.castShadow = true; // Walls cast shadows
    backWall.receiveShadow = true; // Walls receive shadows
    this.scene.add(backWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 4), wallMaterial);
    rightWall.position.set(3, 2, 0);
    rightWall.castShadow = true; // Walls cast shadows
    rightWall.receiveShadow = true; // Walls receive shadows
    this.scene.add(rightWall);

    // Toit principal
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(4.5, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0x5b0e0e })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 5;
    roof.castShadow = true; // Roof casts shadows
    this.scene.add(roof);

    // Sol intérieur
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 3.8),
      new THREE.MeshStandardMaterial({ color: 0xd2b48c })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true; // Floor receives shadows
    this.scene.add(floor);

    // Bar principal
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    bar.position.set(0, 0.5, 1.8);
    bar.castShadow = true; // Bar casts shadows
    bar.receiveShadow = true; // Bar receives shadows
    this.scene.add(bar);

    // === 🧊 AUVENT (Toit plastique) + 🧱 PIEDS ===
    const awningWidth = 6;
    const awningDepth = 1.5;
    const awningHeight = 0.1;

    const awningGeometry = new THREE.BoxGeometry(awningWidth, awningHeight, awningDepth);
    const awningMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      metalness: 0.2,
      roughness: 0.4
    });

    const awning = new THREE.Mesh(awningGeometry, awningMaterial);
    awning.position.set(0, 3.2, 2 + awningDepth / 2);
    awning.rotation.x = Math.PI / 10;
    awning.castShadow = true; // Awning casts shadows
    awning.receiveShadow = true; // Awning receives shadows
    this.scene.add(awning);

    // Pieds métalliques (2 colonnes)
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3.2);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-awningWidth / 2 + 0.1, 1.6, 2.3);
    leftLeg.castShadow = true; // Legs cast shadows
    this.scene.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(awningWidth / 2 - 0.1, 1.6, 2.3);
    rightLeg.castShadow = true; // Legs cast shadows
    this.scene.add(rightLeg);

    // Table
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x6b4f3b })
    );
    table.position.set(0, 1, 0);
    table.castShadow = true; // Table casts shadows
    table.receiveShadow = true; // Table receives shadows
    this.scene.add(table);

    // Chaises
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
    [-0.8, 0.8].forEach(x => {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), chairMat);
      chair.position.set(x, 0.2, 0);
      chair.castShadow = true; // Chairs cast shadows
      chair.receiveShadow = true; // Chairs receive shadows
      this.scene.add(chair);
    });

    // Bouteilles
    const bottleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16);
    [0xff0000, 0x00ff00].forEach((color, i) => {
      const bottle = new THREE.Mesh(bottleGeo, new THREE.MeshStandardMaterial({ color }));
      bottle.position.set(i === 0 ? -0.2 : 0.2, 1.15, i === 0 ? -0.1 : 0.2);
      bottle.castShadow = true; // Bottles cast shadows
      this.scene.add(bottle);
    });

    // Frites
    for (let i = 0; i < 5; i++) {
      const fry = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.01, 0.01),
        new THREE.MeshStandardMaterial({ color: 0xffff00 })
      );
      fry.position.set(-0.1 + i * 0.05, 1.16, 0);
      fry.castShadow = true; // Fries cast shadows
      this.scene.add(fry);
    }

    // Distributeur de cigarettes
    const vendingMachine = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    vendingMachine.position.set(2.7, 1, 1.6);
    vendingMachine.castShadow = true; // Vending machine casts shadows
    this.scene.add(vendingMachine);

    // Ajout des lampes de luxe
    this.addLuxuryLamps();

    // Resize
    window.addEventListener('resize', this.onWindowResize);
  }

  private addLuxuryLamps(): void {
    const lampGroup = new THREE.Group();

    // Matériau métallique brillant
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc66,
      metalness: 1,
      roughness: 0.2,
      emissive: 0xffaa33,
      emissiveIntensity: 0.6
    });

    // Globe de la lampe (sphère dorée)
    const globeGeometry = new THREE.SphereGeometry(0.15, 32, 32);

    // Suspension (cylindre fin)
    const cordGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2);

    // Positions X des deux lampes (au-dessus du bar, un peu espacées)
    const positionsX = [-0.8, 0.8];
    positionsX.forEach(x => {
      // Suspension
      const cord = new THREE.Mesh(cordGeometry, new THREE.MeshStandardMaterial({ color: 0x222222 }));
      cord.position.set(x, 3.4, 2);
      lampGroup.add(cord);

      // Globe lumineux
      const globe = new THREE.Mesh(globeGeometry, metalMaterial);
      globe.position.set(x, 2.8, 2);
      lampGroup.add(globe);

      // Lumière ponctuelle chaude
      const light = new THREE.PointLight(0xffcc66, 1, 5);
      light.position.set(x, 2.8, 2);
      lampGroup.add(light);
    });

    this.scene.add(lampGroup);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.animateLeaves();

  };

  private onWindowResize = (): void => {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
  // Ajout des arbres/plantes
private addTrees(): void {
  const treeGroup = new THREE.Group();

  const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });

  const leavesGeometry = new THREE.SphereGeometry(0.5, 8, 8);
  const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });

  const positions = [
    [-5, 0.5, -5],
    [5, 0.5, -5],
    [5, 0.5, 5]
  ];

  positions.forEach(pos => {
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(pos[0], pos[1] / 2, pos[2]);

    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(pos[0], pos[1] + 0.5, pos[2]);

    treeGroup.add(trunk);
    treeGroup.add(leaves);
  });

  this.scene.add(treeGroup);
}

// Animation vent pour les feuilles (un petit balancement simple)
private animateLeaves(): void {
  const time = Date.now() * 0.001;
  this.scene.traverse(obj => {
    if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry && obj.material.color.getHex() === 0x228B22) {
      obj.position.x += Math.sin(time + obj.position.z) * 0.001;
      obj.position.z += Math.cos(time + obj.position.x) * 0.001;
    }
  });
}

// Ajouter un ciel simple avec dégradé (via fond shader simple)
private addSky(): void {
  const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        gl_FragColor = vec4(mix(vec3(0.6, 0.8, 1.0), vec3(1.0), smoothstep(0.0, 0.5, h)), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  this.scene.add(sky);
}
private addBahnhofLampPost(): void {
  const group = new THREE.Group();
  this.signPanels = [];

  // === 🏗️ Poteau principal ===
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 5, 16),
    new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 1 })
  );
  pole.position.y = 2.5;
  group.add(pole);

  // === 🕰️ Bahnhofuhr (face principale vers le restaurant, donc Z négatif) ===
  const clockTex = new THREE.TextureLoader().load('assets/clock-bahnhof.jpg');
  const clockMat = new THREE.MeshBasicMaterial({ map: clockTex, side: THREE.DoubleSide });
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), clockMat);
  clock.position.set(0, 3.8, 0.48);
  group.add(clock);

  const clockHolder = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  clockHolder.position.set(0, 3.8, 0.25);
  group.add(clockHolder);

  // === 💡 Lampes suspendues sur extension ===
  const lightArmLength = 0.5;
  [-0.25, 0.25].forEach(x => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, lightArmLength),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    arm.rotation.z = Math.PI / 2;
    arm.position.set(x, 4.6, 0);
    group.add(arm);

    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    chain.position.set(x + (x > 0 ? lightArmLength / 2 : -lightArmLength / 2), 4.5, 0);
    group.add(chain);

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffffcc,
        emissive: 0xffcc88,
        emissiveIntensity: 0.9
      })
    );
    lamp.position.set(x + (x > 0 ? lightArmLength / 2 : -lightArmLength / 2), 4.3, 0);
    group.add(lamp);

    const light = new THREE.PointLight(0xffcc88, 0.6, 6);
    light.position.copy(lamp.position);
    group.add(light);
  });

  // === 🪧 Panneaux directionnels ===
  const labels = ['Profil', 'Daten', 'Skills', 'SoftSkills', 'Projekte', 'Akademisch', 'Sprachen', 'Erfahrung'];
  const directions = [Math.PI / 2, Math.PI / 3, -Math.PI / 2, -Math.PI / 3, 0, Math.PI / 4, -Math.PI / 4, Math.PI];


  const createTexture = (text: string, mirrored = false): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';

    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

 labels.forEach((text, i) => {
  const geometry = new THREE.PlaneGeometry(1.4, 0.3);

  const frontMat = new THREE.MeshBasicMaterial({
    map: createTexture(text),
    side: THREE.FrontSide
  });

  const backMat = new THREE.MeshBasicMaterial({
    map: createTexture(text, true),
    side: THREE.FrontSide
  });

  const front = new THREE.Mesh(geometry, frontMat);
  front.position.set(0, 3.3 - i * 0.4, 0);
  front.rotation.y = directions[i];
  front.translateX(0.7);
  group.add(front);

  const back = new THREE.Mesh(geometry, backMat);
  back.position.copy(front.position);
  back.rotation.copy(front.rotation);
  back.rotateY(Math.PI);
  group.add(back);

  // ⬇️ Ajoute ce panneau à la liste pour l'interaction par clic
  this.signPanels.push({ mesh: front, label: text });
});


  // Position finale du lampadaire
  group.position.set(-5.5, 0, 5); // 5m devant le resto, un peu à gauche

  this.scene.add(group);
}
private addGiantScreens(): void {
  const panelGeometry = new THREE.PlaneGeometry(2.2, 1.2);
  const panelMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide
  });

  const panels: THREE.Mesh[] = [];

  // Gauche
  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  leftPanel.position.set(-4.2, 6.1, 0);  // extrême gauche au-dessus du toit
  leftPanel.rotation.y = Math.PI / 8;
  panels.push(leftPanel);

  // Droite
  const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  rightPanel.position.set(4.2, 6.1, 0);  // extrême droite au-dessus du toit
  rightPanel.rotation.y = -Math.PI / 8;
  panels.push(rightPanel);

  // Avant
  const frontPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  frontPanel.position.set(0, 6.1, 2.5);  // en façade, un peu avancé
  frontPanel.rotation.y = 0;
  panels.push(frontPanel);

  // Arrière (optionnel)
  const backPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  backPanel.position.set(0, 6.1, -2.5);  // arrière du bâtiment
  backPanel.rotation.y = Math.PI;
  panels.push(backPanel);

  // Ajout à la scène
  panels.forEach(panel => {
    this.scene.add(panel);
    this.signPanels.push({ mesh: panel, label: 'giant' }); // pour le clic
  });
}
private async renderToTexture(): Promise<THREE.Texture> {
  const element = document.getElementById('render-content');
  if (!element) {
    console.warn('Element with ID "render-content" not found. Returning a blank texture.');
    // Return a dummy canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (context) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, 1, 1);
    }
    return new THREE.CanvasTexture(canvas);
  }
  const canvas = await html2canvas(element);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
  async createPanelWithContent() {
    const texture = await this.renderToTexture();
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(3.5, 2.2);
    this.screenPanel = new THREE.Mesh(geometry, material);
    this.screenPanel.name = 'main-screen';
    this.screenPanel.position.set(0, 5.5, -4.5);
    this.scene.add(this.screenPanel);
    this.signPanels.push({ mesh: this.screenPanel, label: 'main' });
  }

  async updatePanelContent() {
    const newTexture = await this.renderToTexture();
    const material = this.screenPanel.material as THREE.MeshBasicMaterial;
    material.map?.dispose();
    material.map = newTexture;
    material.needsUpdate = true;
  }
}
