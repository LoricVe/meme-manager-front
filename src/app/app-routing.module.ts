import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { MemeGalleryComponent } from './pages/meme-gallery/meme-gallery.component';
import { MemeDetailComponent } from './pages/meme-detail/meme-detail.component';
import { CreateMeme } from './pages/create-meme/create-meme';
import { AuthGuard } from './shared/guards/auth.guard';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AdminMemesComponent } from './pages/admin/admin-memes/admin-memes';
import { AdminTagsComponent } from './pages/admin/admin-tags/admin-tags';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/gallery',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'auth/callback',
    component: AuthCallbackComponent
  },
  {
    path: 'gallery',
    component: MemeGalleryComponent
  },
  {
    path: 'meme/:id',
    component: MemeDetailComponent
  },
  {
    path: 'create-meme',
    component: CreateMeme,
    canActivate: [AuthGuard]
  },
  {
    path: 'edit-meme/:id',
    component: CreateMeme,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/memes',
    component: AdminMemesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/tags',
    component: AdminTagsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/gallery'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
