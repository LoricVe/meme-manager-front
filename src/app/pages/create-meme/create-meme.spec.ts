import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMeme } from './create-meme';

describe('CreateMeme', () => {
  let component: CreateMeme;
  let fixture: ComponentFixture<CreateMeme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateMeme]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMeme);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
