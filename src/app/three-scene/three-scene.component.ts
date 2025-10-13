import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import * as THREE from 'three';
import { NavigationEnd, Router } from '@angular/router';
import html2canvas from 'html2canvas';
import { filter } from 'rxjs/operators';
import { SceneControlService } from '../scene-control.service';

@Component({
  selector: 'app-three-scene',
  standalone: true,
  template: `<canvas #canvas style="cursor: grab;"></canvas>`,
  styles: [`canvas { width: 100%; height: 100vh; display: block; }`]
})
export class ThreeSceneComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private router: Router, private sceneControlService: SceneControlService) {}

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId = 0;

  private signPanels: { mesh: THREE.Mesh, label: string }[] = [];
  private screenPanel!: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Mouse control properties
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private dragThreshold = 3; // Pixels

  // Orbit control properties
  private cameraTarget = new THREE.Vector3(0, 1.5, 0);
  private cameraRadius = 10;
  private cameraAzimuth = 0; // Start from front
  private cameraPolar = Math.PI / 2; // Start level

  // Zoom properties
  private isZooming = false;
  private zoomStartTime = 0;
  private zoomDuration = 1000; // 1 second
  private initialCameraPosition = new THREE.Vector3();
  private targetCameraPosition = new THREE.Vector3();
  private initialCameraTarget = new THREE.Vector3();
  private targetCameraTarget = new THREE.Vector3();

  async ngOnInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.initThree();
    await this.createPanelWithContent(); // Initial content
    this.animate();

    // Add mouse event listeners
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('mouseleave', this.onMouseLeave);
    canvas.addEventListener('wheel', this.onMouseWheel);
    window.addEventListener('resize', this.onWindowResize);

    // Router subscription to update screen
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      setTimeout(() => {
        this.updatePanelContent();
      }, 100);
    });

    // Scene control subscription
    this.sceneControlService.zoomRequest$.subscribe(target => {
      if (typeof target === 'string' && target === 'screen') {
        this.zoomToScreen();
      } else if (target instanceof THREE.Object3D) {
        this.zoomOnObject(target);
      }
    });
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      cancelAnimationFrame(this.animationId);
      window.removeEventListener('resize', this.onWindowResize);
      const canvas = this.canvasRef?.nativeElement;
      if (canvas) {
        canvas.removeEventListener('mousedown', this.onMouseDown);
        canvas.removeEventListener('mouseup', this.onMouseUp);
        canvas.removeEventListener('mousemove', this.onMouseMove);
        canvas.removeEventListener('click', this.onClick);
        canvas.removeEventListener('mouseleave', this.onMouseLeave);
        canvas.removeEventListener('wheel', this.onMouseWheel);
      }
    }
    this.renderer?.dispose();
  }

  // --- Mouse Event Handlers ---

  private onMouseDown = (event: MouseEvent) => {
    this.isDragging = true;
    this.canvasRef.nativeElement.style.cursor = 'grabbing';
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  };

  private onMouseUp = () => {
    this.isDragging = false;
    this.canvasRef.nativeElement.style.cursor = 'grab';
  };
  
  private onMouseLeave = () => {
    this.isDragging = false;
    this.canvasRef.nativeElement.style.cursor = 'grab';
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    this.cameraAzimuth -= deltaX * 0.01;
    this.cameraPolar -= deltaY * 0.01;
    this.cameraPolar = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.cameraPolar));

    this.previousMousePosition = { x: event.clientX, y: event.clientY };
    this.updateCameraPosition();
  };

  private onClick = (event: MouseEvent) => {
    const deltaX = Math.abs(event.clientX - this.previousMousePosition.x);
    const deltaY = Math.abs(event.clientY - this.previousMousePosition.y);

    if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
        return; // It was a drag, not a click
    }

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const clickableMeshes = this.signPanels.map(p => p.mesh);
    const intersects = this.raycaster.intersectObjects(clickableMeshes, true);

    if (intersects.length > 0) {
      let clickedObject: THREE.Object3D | null = intersects[0].object;
      let sign = this.signPanels.find(p => p.mesh === clickedObject);

      while (clickedObject && !sign) {
        sign = this.signPanels.find(p => p.mesh === clickedObject);
        clickedObject = clickedObject.parent;
      }

      if (sign && sign.label !== 'giant' && sign.label !== 'main') {
        this.sceneControlService.requestZoom(sign.mesh);
        const route = sign.label.toLowerCase();
        this.router.navigate([`/${route}`]);
      }
    }
  };

  private zoomOnObject(targetObject: THREE.Object3D) {
    console.log('zoomOnObject called with:', targetObject.name || targetObject.uuid);
    if (this.isZooming) return;

    this.isZooming = true;
    this.zoomStartTime = Date.now();

    this.initialCameraPosition.copy(this.camera.position);
    this.initialCameraTarget.copy(this.cameraTarget);

    const targetPosition = new THREE.Vector3();
    targetObject.getWorldPosition(targetPosition);

    this.targetCameraTarget.copy(targetPosition);

    // Calculate camera position to be 3 units away from the object
    const offset = this.camera.position.clone().sub(targetPosition).normalize().multiplyScalar(3);
    this.targetCameraPosition.copy(targetPosition).add(offset);
  }

  private zoomToScreen() {
    console.log('zoomToScreen called');
    this.zoomOnObject(this.screenPanel);
  }

  private onMouseWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.cameraRadius -= event.deltaY * 0.01;
    this.cameraRadius = Math.max(3, Math.min(20, this.cameraRadius));
    this.updateCameraPosition();
  };

  private updateCameraPosition(): void {
    const x = this.cameraTarget.x + this.cameraRadius * Math.sin(this.cameraPolar) * Math.sin(this.cameraAzimuth);
    const y = this.cameraTarget.y + this.cameraRadius * Math.cos(this.cameraPolar);
    const z = this.cameraTarget.z + this.cameraRadius * Math.sin(this.cameraPolar) * Math.cos(this.cameraAzimuth);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

   private initThree(): void {
    this.signPanels = []; // Initialize here to gather all clickable panels

    const canvas = this.canvasRef.nativeElement;
    this.scene = new THREE.Scene();
    this.addSky();
    this.addTrees();
    this.addBahnhofLampPost();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.updateCameraPosition();
    this.addGiantScreens();
    this.addTrainTracks();
    this.addTrain();
    this.addPlatformDetails();
    this.addPlatformRoof();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lumières
    const hemisphereLight = new THREE.HemisphereLight(0x404050, 0x080820, 0.1);
    this.scene.add(hemisphereLight);

    const dirLight = new THREE.DirectionalLight(0x405060, 0.1);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    this.scene.add(dirLight);

    this.addAwningLights();
    this.addPlatformLights();
    this.addStreetLights();

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x707070 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.createMainBuilding();
    this.addCharacters();
    this.addMenuBoard();
    this.addTableDetails();
    this.addBusStop();
    this.addBus();
  }

  private addBus(): void {
    const busGroup = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0055A2, metalness: 0.7, roughness: 0.4 });
    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.3 });
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.1 });

    // Bus Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 2.5, 2.2), bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = false;
    busGroup.add(body);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
    wheelGeometry.rotateX(Math.PI / 2);
    const wheelPositions = [-2.5, 2.5];
    wheelPositions.forEach(x => {
      [-1.1, 1.1].forEach(z => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(x, 0.5, z);
        busGroup.add(wheel);
      });
    });

    // Windows
    const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 0.1), windowMaterial);
    sideWindow.position.set(0, 2, 1.1);
    busGroup.add(sideWindow);
    
    const otherSideWindow = sideWindow.clone();
    otherSideWindow.position.z = -1.1;
    busGroup.add(otherSideWindow);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 2.0), windowMaterial);
    windshield.position.set(3.95, 2, 0);
    windshield.rotation.y = Math.PI / 12;
    busGroup.add(windshield);

    // Headlights
    [-0.8, 0.8].forEach(z => {
      const lightFixture = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 }));
      lightFixture.position.set(3.95, 1, z);
      lightFixture.rotation.z = Math.PI / 2;
      busGroup.add(lightFixture);

      const headLight = new THREE.SpotLight(0xffffff, 4.0, 20, Math.PI / 5, 0.5, 2);
      headLight.position.set(4, 1, z);
      headLight.target.position.set(10, 1, z);
      busGroup.add(headLight);
      busGroup.add(headLight.target);
    });

    // Line Number Display
    const numberTexture = this.createBusNumberTexture();
    const numberMaterial = new THREE.MeshBasicMaterial({ map: numberTexture });
    const numberDisplay = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.4), numberMaterial);
    numberDisplay.position.set(4.01, 2.5, 0);
    numberDisplay.rotation.y = Math.PI / 2;
    busGroup.add(numberDisplay);

    // RMV Logo
    const logoTexture = this.createRMVLogoTexture();
    const logoMaterial = new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true });
    const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), logoMaterial);
    logoPlane.position.set(-1, 1.5, 1.11);
    busGroup.add(logoPlane);

    busGroup.position.set(10, 0, -5);
    busGroup.rotation.y = -Math.PI / 2;
    this.scene.add(busGroup);
  }

  private createBusNumberTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 45px "Courier New", Courier, monospace';
    ctx.fillStyle = '#FFA500'; // Orange color
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('801', canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createRMVLogoTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple stylized logo
    ctx.fillStyle = '#D9000D'; // Red
    ctx.fillRect(20, 20, 60, 88);
    ctx.fillStyle = '#009650'; // Green
    ctx.fillRect(90, 20, 60, 88);
    ctx.fillStyle = '#006AB3'; // Blue
    ctx.fillRect(160, 20, 60, 88);

    ctx.font = 'bold 80px sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('RMV', 250, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private addBusStop(): void {
    const busStopGroup = new THREE.Group();

    const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9, roughness: 0.5 });
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.2
    });

    // Shelter structure
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2), metalMaterial);
    roof.position.y = 2.5;
    roof.castShadow = true;
    busStopGroup.add(roof);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 0.05), glassMaterial);
    backWall.position.set(0, 1.25, -0.9);
    busStopGroup.add(backWall);

    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.4, 2), glassMaterial);
    sideWall.position.set(-1.95, 1.25, 0);
    busStopGroup.add(sideWall);

    // Light inside the shelter
    const lightColor = 0xffd899;
    const shelterLight = new THREE.PointLight(lightColor, 3.0, 8, 2);
    shelterLight.position.set(0, 2.4, -0.4); // Under the roof, centered
    shelterLight.castShadow = true;
    busStopGroup.add(shelterLight);

    const lightFixture = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.05, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x333333, emissive: lightColor, emissiveIntensity: 1.0 })
    );
    lightFixture.position.copy(shelterLight.position);
    busStopGroup.add(lightFixture);

    // Bench inside the shelter
    const bench = this.createBench();
    bench.scale.set(0.8, 0.8, 0.8);
    bench.position.set(0, 0.2, -0.5);
    busStopGroup.add(bench);

    // Bus stop sign
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 16), metalMaterial);
    signPole.position.set(2.5, 1.5, 0);
    signPole.castShadow = true;
    busStopGroup.add(signPole);

    const signGeometry = new THREE.CircleGeometry(0.4, 32);

    // Front Sign
    const frontTexture = this.createBusSignTexture();
    const frontMaterial = new THREE.MeshBasicMaterial({ map: frontTexture });
    const frontSign = new THREE.Mesh(signGeometry, frontMaterial);
    frontSign.position.set(2.5, 3.2, 0);
    busStopGroup.add(frontSign);

    // Back Sign (mirrored)
    const backTexture = this.createBusSignTexture(true);
    const backMaterial = new THREE.MeshBasicMaterial({ map: backTexture });
    const backSign = new THREE.Mesh(signGeometry, backMaterial);
    backSign.position.copy(frontSign.position);
    backSign.rotation.y = Math.PI;
    busStopGroup.add(backSign);

    busStopGroup.position.set(14, 0, -5); // Moved further to the right
    busStopGroup.rotation.y = -Math.PI / 2;
    this.scene.add(busStopGroup);
  }

  private createBusSignTexture(mirrored = false): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFD700'; // Yellow background
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.stroke();

    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.font = 'bold 150px sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  private createMainBuilding(): void {
    const buildingGroup = new THREE.Group();

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 0.1), wallMaterial);
    backWall.position.set(0, 2, -2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    buildingGroup.add(backWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 4), wallMaterial);
    rightWall.position.set(3, 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    buildingGroup.add(rightWall);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2, 4), new THREE.MeshStandardMaterial({ color: 0x5b0e0e }));
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 5;
    roof.castShadow = true;
    buildingGroup.add(roof);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 3.8), new THREE.MeshStandardMaterial({ color: 0xd2b48c }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    buildingGroup.add(floor);

    const bar = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.8), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
    bar.position.set(0, 0.5, 1.8);
    bar.castShadow = true;
    bar.receiveShadow = true;
    buildingGroup.add(bar);

    const awningWidth = 6;
    const awningDepth = 1.5;
    const awningHeight = 0.1;
    const awningGeometry = new THREE.BoxGeometry(awningWidth, awningHeight, awningDepth);
    const awningMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, metalness: 0.2, roughness: 0.4 });
    const awning = new THREE.Mesh(awningGeometry, awningMaterial);
    awning.position.set(0, 3.2, 2 + awningDepth / 2);
    awning.rotation.x = Math.PI / 10;
    awning.castShadow = true;
    awning.receiveShadow = true;
    buildingGroup.add(awning);

    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3.2);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-awningWidth / 2 + 0.1, 1.6, 2.3);
    leftLeg.castShadow = true;
    buildingGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(awningWidth / 2 - 0.1, 1.6, 2.3);
    rightLeg.castShadow = true;
    buildingGroup.add(rightLeg);

    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0x6b4f3b }));
    table.position.set(0, 1, 0);
    table.castShadow = true;
    table.receiveShadow = true;
    buildingGroup.add(table);

    const chairMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
    [-0.8, 0.8].forEach(x => {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), chairMat);
      chair.position.set(x, 0.2, 0);
      chair.castShadow = true;
      chair.receiveShadow = true;
      buildingGroup.add(chair);
    });

    const bottleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16);
    [0xff0000, 0x00ff00].forEach((color, i) => {
      const bottle = new THREE.Mesh(bottleGeo, new THREE.MeshStandardMaterial({ color }));
      bottle.position.set(i === 0 ? -0.2 : 0.2, 1.15, i === 0 ? -0.1 : 0.2);
      bottle.castShadow = true;
      buildingGroup.add(bottle);
    });

    for (let i = 0; i < 5; i++) {
      const fry = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 0.01), new THREE.MeshStandardMaterial({ color: 0xffff00 }));
      fry.position.set(-0.1 + i * 0.05, 1.16, 0);
      fry.castShadow = true;
      buildingGroup.add(fry);
    }

    const vendingMachine = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.3), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    vendingMachine.position.set(2.7, 1, 1.6);
    vendingMachine.castShadow = true;
    buildingGroup.add(vendingMachine);

    const windowGlassMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      metalness: 0.9
    });
    const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

    const createWindow = () => {
      const windowGroup = new THREE.Group();
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.2), windowGlassMaterial);
      windowGroup.add(glass);
      const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.1), windowFrameMaterial);
      frameTop.position.y = 0.6;
      windowGroup.add(frameTop);
      const frameBottom = frameTop.clone();
      frameBottom.position.y = -0.6;
      windowGroup.add(frameBottom);
      const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.1), windowFrameMaterial);
      frameLeft.position.x = -0.5;
      windowGroup.add(frameLeft);
      const frameRight = frameLeft.clone();
      frameRight.position.x = 0.5;
      windowGroup.add(frameRight);
      return windowGroup;
    }

    const window1 = createWindow();
    window1.position.set(-1.5, 2.5, -1.95);
    buildingGroup.add(window1);

    const window2 = createWindow();
    window2.position.set(1.5, 2.5, -1.95);
    buildingGroup.add(window2);

    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3A21 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2, 1), doorMaterial);
    door.position.set(2.95, 1, -0.5);
    buildingGroup.add(door);
    
    const doorHandle = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0 })
    );
    doorHandle.position.set(2.85, 1, -0.2);
    buildingGroup.add(doorHandle);

    this.scene.add(buildingGroup);
  }

  private addCharacters(): void {
    const characterMaterial = new THREE.MeshStandardMaterial({ color: 0x1E90FF }); // DodgerBlue

    const createCharacter = () => {
      const character = new THREE.Group();
      
      // Torso
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.8, 0.3),
        characterMaterial
      );
      torso.castShadow = true;
      character.add(torso);

      // Head
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.3),
        characterMaterial
      );
      head.position.y = 0.6;
      head.castShadow = true;
      character.add(head);

      return character;
    }

    // Character 1
    const char1 = createCharacter();
    char1.position.set(-0.8, 0.8, 0); // On the chair
    this.scene.add(char1);

    // Character 2
    const char2 = createCharacter();
    char2.position.set(0.8, 0.8, 0); // On the other chair
    char2.rotation.y = Math.PI; // Face the other way
    this.scene.add(char2);
  }

  private addMenuBoard(): void {
    const menuBoardGroup = new THREE.Group();

    // --- Modern Stand ---
    const standMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.4 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 32), standMaterial);
    base.castShadow = true;
    menuBoardGroup.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 16), standMaterial);
    pole.position.y = 0.75;
    pole.castShadow = true;
    menuBoardGroup.add(pole);

    // --- Screen Group (Frame, Screen, and Text) ---
    const screenGroup = new THREE.Group();
    screenGroup.position.y = 1.5 + 0.9; 
    screenGroup.rotation.x = -Math.PI / 12;
    menuBoardGroup.add(screenGroup);

    // Screen Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 0.08), standMaterial);
    frame.castShadow = true;
    screenGroup.add(frame);

    // Screen Surface
    const screenMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x111111,
        emissiveIntensity: 1.5
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.7), screenMaterial);
    screen.position.z = 0.045; 
    screenGroup.add(screen);

    const menuItems = [
      { label: 'Profil', text: 'About Me' },
      { label: 'Daten', text: 'Data' },
      { label: 'Skills', text: 'Skills' },
      { label: 'SoftSkills', text: 'Soft Skills' },
      { label: 'Projekte', text: 'Projects' },
      { label: 'Akademisch', text: 'Academic' },
      { label: 'Sprachen', text: 'Languages' },
      { label: 'Erfahrung', text: 'Experience' }
    ];

    const itemHeight = 0.18;
    const spacing = 0.02;
    const totalItemBlockHeight = menuItems.length * (itemHeight + spacing) - spacing;
    const startY = (totalItemBlockHeight / 2) - (itemHeight / 2);

    menuItems.forEach((item, index) => {
      const createMenuItemTexture = (text: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 40px sans-serif';
        ctx.fillStyle = '#00bfff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
      };

      const itemGeometry = new THREE.PlaneGeometry(2.2, itemHeight);
      const itemMaterial = new THREE.MeshBasicMaterial({ map: createMenuItemTexture(item.text), transparent: true });
      const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);
      
      const yPos = startY - index * (itemHeight + spacing);
      itemMesh.position.set(0, yPos, 0.05);
      
      screenGroup.add(itemMesh);
      this.signPanels.push({ mesh: itemMesh, label: item.label });
    });

    menuBoardGroup.position.set(4.3, 0, 2.2);
    menuBoardGroup.scale.set(0.8, 0.8, 0.8);
    this.scene.add(menuBoardGroup);
  }

  private addTableDetails(): void {
    const cupMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 });
    const cupGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 16);

    const plateMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3 });
    const plateGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16);

    const cup1 = new THREE.Mesh(cupGeometry, cupMaterial);
    cup1.position.set(-0.2, 1.08, 0.1);
    this.scene.add(cup1);

    const plate1 = new THREE.Mesh(plateGeometry, plateMaterial);
    plate1.position.set(0.2, 1.01, -0.1);
    this.scene.add(plate1);
  }

  private addAwningLights(): void {
    const lightGroup = new THREE.Group();
    const lightColor = 0xffd899;
    const intensity = 3.5;
    const distance = 6;
    const decay = 2;

    const positionsX = [-2, 0, 2];
    for (const x of positionsX) {
        const light = new THREE.PointLight(lightColor, intensity, distance, decay);
        light.position.set(x, 3, 2.5);
        light.castShadow = true;
        lightGroup.add(light);

        const fixture = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x555555, emissive: lightColor, emissiveIntensity: 1.0 })
        );
        fixture.position.copy(light.position);
        lightGroup.add(fixture);
    }
    this.scene.add(lightGroup);
  }

  private addPlatformLights(): void {
    const lightGroup = new THREE.Group();
    const lightColor = 0xffd899;
    const intensity = 4.0;
    const distance = 8;
    const decay = 2;

    const zPositions = [-7, 0, 7];

    for (const z of zPositions) {
      const light = new THREE.PointLight(lightColor, intensity, distance, decay);
      light.position.set(-12.5, 3.2, z);
      light.castShadow = true;
      lightGroup.add(light);

      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.1, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x333333, emissive: lightColor, emissiveIntensity: 1.0 })
      );
      fixture.position.copy(light.position);
      lightGroup.add(fixture);
    }
    this.scene.add(lightGroup);
  }

  private addStreetLights(): void {
    const lampPostPositions = [
      new THREE.Vector3(12, 0, 12),
      new THREE.Vector3(12, 0, -12),
      new THREE.Vector3(-10, 0, 12),
      new THREE.Vector3(-10, 0, -12)
    ];

    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const lightFixtureMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd899, emissiveIntensity: 2.0 });

    const createLampPost = (position: THREE.Vector3) => {
      const lampGroup = new THREE.Group();

      const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 4, 16);
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.y = 2;
      pole.castShadow = true;
      lampGroup.add(pole);

      const armGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);
      const arm = new THREE.Mesh(armGeometry, poleMaterial);
      arm.position.set(0.5, 4, 0);
      arm.castShadow = true;
      lampGroup.add(arm);

      const fixtureGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const fixture = new THREE.Mesh(fixtureGeometry, lightFixtureMaterial);
      fixture.position.set(1, 3.8, 0);
      lampGroup.add(fixture);

      const pointLight = new THREE.PointLight(0xffd899, 3.0, 15, 2);
      pointLight.position.copy(fixture.position);
      pointLight.castShadow = true;
      lampGroup.add(pointLight);

      lampGroup.position.copy(position);
      lampGroup.rotation.y = Math.atan2(position.x, position.z) + Math.PI;

      this.scene.add(lampGroup);
    };

    lampPostPositions.forEach(pos => createLampPost(pos));
  }

  private addTrainTracks(): void {
    const trackGroup = new THREE.Group();

    const platformGeometry = new THREE.BoxGeometry(3, 0.2, 15);
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-12.5, 0.1, 0);
    platform.receiveShadow = true;
    trackGroup.add(platform);

    const sleeperGeometry = new THREE.BoxGeometry(0.2, 0.05, 2);
    const sleeperMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4F3B });
    for (let i = -15; i < 15; i += 0.8) {
      const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial);
      sleeper.position.set(-14.5, 0.05, i);
      sleeper.receiveShadow = true;
      trackGroup.add(sleeper);
    }

    const railGeometry = new THREE.BoxGeometry(0.08, 0.08, 30);
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.5 });
    
    const rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(-14.2, 0.12, 0);
    rail1.castShadow = true;
    trackGroup.add(rail1);

    const rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(-14.8, 0.12, 0);
    rail2.castShadow = true;
    trackGroup.add(rail2);

    this.scene.add(trackGroup);
  }

  private addTrain(): void {
    const trainGroup = new THREE.Group();
    trainGroup.position.set(-14.5, 0.35, 0);
    trainGroup.rotation.y = Math.PI / 2;

    const dbRed = 0xDB1F26;
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: dbRed, metalness: 0.8, roughness: 0.4 });
    const carriageMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.5 });
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.8 });
    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1.0, roughness: 0.2 });
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16);
    wheelGeometry.rotateX(Math.PI / 2);

    const locomotiveGroup = new THREE.Group();
    const locoBody = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 1), bodyMaterial);
    locoBody.position.y = 0.6;
    locoBody.castShadow = true;
    locomotiveGroup.add(locoBody);

    const logoTexture = this.createDBLogoTexture();
    const logoMaterial = new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true });
    const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), logoMaterial);
    logoPlane.position.set(0, 0.7, 0.51);
    locomotiveGroup.add(logoPlane);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    cabin.position.set(-1.25, 1.4, 0);
    cabin.castShadow = true;
    locomotiveGroup.add(cabin);

    const cabinWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.8), windowMaterial);
    cabinWindow.position.set(-1.95, 1.4, 0);
    locomotiveGroup.add(cabinWindow);

    const headLightFixture = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0 }));
    headLightFixture.position.set(-2.0, 0.8, 0);
    headLightFixture.rotation.z = Math.PI / 2;
    locomotiveGroup.add(headLightFixture);

    const headLight = new THREE.SpotLight(0xffffff, 5.0, 20, Math.PI / 6, 0.5, 2);
    headLight.position.set(-2.0, 0.8, 0);
    headLight.target.position.set(-10, 0.8, 0);
    locomotiveGroup.add(headLight);
    locomotiveGroup.add(headLight.target);

    for (let i = 0; i < 2; i++) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(-1 + i * 2, 0, 0);
      locomotiveGroup.add(wheel);
    }
    locomotiveGroup.position.x = -10;
    trainGroup.add(locomotiveGroup);

    const carriageLength = 5;
    const carriageWidth = 1.1;
    const carriageHeight = 1.4;
    const carriageSpacing = 0.5;
    let currentX = -10 + 4 / 2 + carriageSpacing + carriageLength / 2;

    for (let i = 0; i < 2; i++) {
      const carriageGroup = new THREE.Group();
      const carriageBody = new THREE.Mesh(new THREE.BoxGeometry(carriageLength, carriageHeight, carriageWidth), carriageMaterial);
      carriageBody.position.y = 0.7;
      carriageBody.castShadow = true;
      carriageGroup.add(carriageBody);

      for (let j = -1; j <= 1; j += 2) { 
        for (let k = -1.5; k <= 1.5; k += 1) {
          const window = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), windowMaterial);
          window.position.set(k, 0.9, (carriageWidth / 2) * j);
          carriageGroup.add(window);
        }
      }

      for (let j = 0; j < 2; j++) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(-1.5 + j * 3, 0, 0);
        carriageGroup.add(wheel);
      }
      carriageGroup.position.x = currentX;
      trainGroup.add(carriageGroup);
      currentX += carriageLength + carriageSpacing;
    }

    this.scene.add(trainGroup);
  }

  private createDBLogoTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 180px sans-serif';
    ctx.fillStyle = '#DB1F26';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DB', canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createBench(): THREE.Group {
    const bench = new THREE.Group();
    const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x805A46 });
    
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.1, 0.4),
      benchMaterial
    );
    seat.position.y = 0.5;
    seat.castShadow = true;
    bench.add(seat);

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 0.1),
      benchMaterial
    );
    back.position.set(0, 0.8, -0.15);
    back.castShadow = true;
    bench.add(back);

    const leg1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.5, 0.4),
      benchMaterial
    );
    leg1.position.set(-0.9, 0.25, 0);
    leg1.castShadow = true;
    bench.add(leg1);
    
    const leg2 = leg1.clone();
    leg2.position.x = 0.9;
    bench.add(leg2);

    return bench;
  }

  private addPlatformDetails(): void {
    const bench1 = this.createBench();
    bench1.position.set(-12.2, 0.2, -4);
    bench1.rotation.y = -Math.PI / 2;
    this.scene.add(bench1);

    const bench2 = this.createBench();
    bench2.position.set(-12.2, 0.2, 4);
    bench2.rotation.y = -Math.PI / 2;
    this.scene.add(bench2);
  }

  private addPlatformRoof(): void {
    const roofGroup = new THREE.Group();
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5 });
    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });

    const roof = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 16), roofMaterial);
    roof.position.set(-12.5, 3.5, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    roofGroup.add(roof);

    const columnGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3.3, 16);
    const zPositions = [-6, 0, 6];

    for (const z of zPositions) {
      const col1 = new THREE.Mesh(columnGeometry, columnMaterial);
      col1.position.set(-11.5, 1.85, z);
      col1.castShadow = true;
      roofGroup.add(col1);

      const col2 = new THREE.Mesh(columnGeometry, columnMaterial);
      col2.position.set(-13.5, 1.85, z);
      col2.castShadow = true;
      roofGroup.add(col2);
    }

    this.scene.add(roofGroup);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    if (this.isZooming) {
      const now = Date.now();
      const elapsed = now - this.zoomStartTime;
      const progress = Math.min(elapsed / this.zoomDuration, 1);

      // Ease-out quint function for smoother animation
      const easeProgress = 1 - Math.pow(1 - progress, 5);

      this.camera.position.lerpVectors(this.initialCameraPosition, this.targetCameraPosition, easeProgress);
      this.cameraTarget.lerpVectors(this.initialCameraTarget, this.targetCameraTarget, easeProgress);
      this.camera.lookAt(this.cameraTarget);

      console.log('animate: isZooming=', this.isZooming, 'camera.position=', this.camera.position.toArray(), 'cameraTarget=', this.cameraTarget.toArray());

      if (progress >= 1) {
        this.isZooming = false;
      }
    }

    this.animateLeaves();
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = (): void => {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

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

  private animateLeaves(): void {
    const time = Date.now() * 0.001;
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry) {
        if (!Array.isArray(obj.material)) {
          const material = obj.material as THREE.MeshStandardMaterial;
          if (material.color && material.color.getHex() === 0x228B22) {
            obj.position.x += Math.sin(time + obj.position.z) * 0.001;
            obj.position.z += Math.cos(time + obj.position.x) * 0.001;
          }
        }
      }
    });
  }

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
          gl_FragColor = vec4(mix(vec3(0.0, 0.0, 0.0), vec3(0.05, 0.0, 0.1), smoothstep(0.0, 0.5, h)), 1.0);
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

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 5, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 1 })
    );
    pole.position.y = 2.5;
    group.add(pole);

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

      this.signPanels.push({ mesh: front, label: text });
    });

    group.position.set(-5.5, 0, 5);
    this.scene.add(group);
  }

  private addGiantScreens(): void {
    const panelGeometry = new THREE.PlaneGeometry(2.2, 1.2);
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide
    });

    const panels: THREE.Mesh[] = [];

    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-4.2, 6.1, 0);
    leftPanel.rotation.y = Math.PI / 8;
    panels.push(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(4.2, 6.1, 0);
    rightPanel.rotation.y = -Math.PI / 8;
    panels.push(rightPanel);

    const frontPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    frontPanel.position.set(0, 6.1, 2.5);
    frontPanel.rotation.y = 0;
    panels.push(frontPanel);

    const backPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    backPanel.position.set(0, 6.1, -2.5);
    backPanel.rotation.y = Math.PI;
    panels.push(backPanel);

    panels.forEach(panel => {
      this.scene.add(panel);
      this.signPanels.push({ mesh: panel, label: 'giant' });
    });
  }

  private async renderToTexture(): Promise<THREE.Texture> {
    const element = document.getElementById('render-content');
    if (!element) {
      console.warn('Element with ID "render-content" not found. Returning a blank texture.');
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
    this.screenPanel.position.set(0, 6.1, 2.5);
    this.scene.add(this.screenPanel);
    this.signPanels.push({ mesh: this.screenPanel, label: 'main' });
    console.log('screenPanel created at:', this.screenPanel.position.toArray());
  }

    async updatePanelContent() {

      const newTexture = await this.renderToTexture();

      const material = this.screenPanel.material as THREE.MeshBasicMaterial;

      material.map?.dispose();

      material.map = newTexture;

      material.needsUpdate = true;

      console.log('screenPanel updated. New texture applied.');

    }

  }

  